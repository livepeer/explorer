/** @jest-environment jsdom */

import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  InMemoryCache,
  Observable,
} from "@apollo/client";
import { act, renderHook, waitFor } from "@testing-library/react";
import { PropsWithChildren } from "react";

import { GovernanceParticipationQuery } from "../apollo/subgraph";
import { calculateParticipation } from "../lib/governanceParticipation";
import {
  GOVERNANCE_PAGE_SIZE,
  loadGovernanceHistory,
  useGovernanceParticipation,
} from "./useGovernanceParticipation";

const page = (
  overrides: Partial<GovernanceParticipationQuery> = {}
): GovernanceParticipationQuery => ({
  __typename: "Query",
  _meta: {
    __typename: "_Meta_",
    block: { __typename: "_Block_", number: 321000 },
  },
  transcoderActivatedEvents: [],
  transcoderDeactivatedEvents: [],
  treasuryProposals: [],
  treasuryVotes: [],
  ...overrides,
});
const activePage = page({
  transcoderActivatedEvents: [
    {
      __typename: "TranscoderActivatedEvent",
      id: "0xabc-1",
      activationRound: "10",
      transaction: { __typename: "Transaction", blockNumber: "100" },
    },
  ],
  treasuryProposals: [
    { __typename: "TreasuryProposal", id: "proposal", voteStart: "9" },
  ],
  treasuryVotes: [
    {
      __typename: "TreasuryVote",
      id: "vote",
      proposal: { __typename: "TreasuryProposal", id: "proposal" },
    },
  ],
});

const createClient = (request: ConstructorParameters<typeof ApolloLink>[0]) =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: new ApolloLink(request),
  });
const clientWrapper = (client: ReturnType<typeof createClient>) =>
  function Wrapper({ children }: PropsWithChildren) {
    return <ApolloProvider client={client}>{children}</ApolloProvider>;
  };

it("survives React's development remount when the first request is aborted", async () => {
  const signals: AbortSignal[] = [];
  const client = createClient(
    (operation) =>
      new Observable((observer) => {
        const signal: AbortSignal = operation.getContext().fetchOptions.signal;
        signals.push(signal);
        const abort = () =>
          observer.error(new DOMException("Aborted", "AbortError"));
        signal.addEventListener("abort", abort);
        queueMicrotask(() => {
          if (!signal.aborted) {
            observer.next({ data: activePage });
            observer.complete();
          }
        });
        return () => signal.removeEventListener("abort", abort);
      })
  );
  const { result } = renderHook(
    () => useGovernanceParticipation("delegate", "10"),
    {
      wrapper: clientWrapper(client),
      reactStrictMode: true,
    }
  );
  await waitFor(() =>
    expect(result.current.treasury).toEqual({ voted: 1, total: 1 })
  );
  expect(signals).toHaveLength(2);
  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);
  expect(result.current.error).toBeUndefined();
});

it("paginates all four histories independently at one indexed block", async () => {
  const proposals = Array.from(
    { length: GOVERNANCE_PAGE_SIZE * 2 + 1 },
    (_, i) => ({
      __typename: "TreasuryProposal" as const,
      id: `proposal-${String(i).padStart(4, "0")}`,
      voteStart: "9",
    })
  );
  const votes = proposals.slice(0, GOVERNANCE_PAGE_SIZE).map(({ id }) => ({
    __typename: "TreasuryVote" as const,
    id: `vote-${id}`,
    proposal: { __typename: "TreasuryProposal" as const, id },
  }));
  const activations = Array.from(
    { length: GOVERNANCE_PAGE_SIZE + 2 },
    (_, i) => ({
      __typename: "TranscoderActivatedEvent" as const,
      id: `0xabc-${i}`,
      activationRound: "10",
      transaction: { __typename: "Transaction" as const, blockNumber: "100" },
    })
  );
  const pages = [
    page({
      transcoderActivatedEvents: activations.slice(0, GOVERNANCE_PAGE_SIZE),
      transcoderDeactivatedEvents: [
        {
          __typename: "TranscoderDeactivatedEvent",
          id: "0xdef-1",
          deactivationRound: "5",
          transaction: { __typename: "Transaction", blockNumber: "50" },
        },
      ],
      treasuryProposals: proposals.slice(0, GOVERNANCE_PAGE_SIZE),
      treasuryVotes: votes,
    }),
    page({
      transcoderActivatedEvents: activations.slice(GOVERNANCE_PAGE_SIZE),
      transcoderDeactivatedEvents: undefined,
      treasuryProposals: proposals.slice(
        GOVERNANCE_PAGE_SIZE,
        GOVERNANCE_PAGE_SIZE * 2
      ),
      treasuryVotes: [],
    }),
    page({
      transcoderActivatedEvents: undefined,
      transcoderDeactivatedEvents: undefined,
      treasuryProposals: proposals.slice(GOVERNANCE_PAGE_SIZE * 2),
      treasuryVotes: undefined,
    }),
  ];
  const requests: Record<string, unknown>[] = [];
  const client = createClient((operation) => {
    requests.push(operation.variables);
    return Observable.of({ data: pages[requests.length - 1] });
  });
  const history = await loadGovernanceHistory(
    client,
    "delegate",
    new AbortController().signal
  );

  expect(history.activations).toHaveLength(1002);
  expect(history.deactivations).toHaveLength(1);
  expect(calculateParticipation(history, "10")).toEqual({
    voted: 1000,
    total: 2001,
  });
  expect(requests).toHaveLength(3);
  expect(requests[0]).not.toHaveProperty("block");
  expect(requests[1]).toMatchObject({
    block: { number: 321000 },
    activationCursor: activations[999].id,
    deactivationCursor: "0xdef-1",
    proposalCursor: proposals[999].id,
    voteCursor: votes[999].id,
    includeActivations: true,
    includeDeactivations: false,
    includeProposals: true,
    includeVotes: true,
  });
  expect(requests[2]).toMatchObject({
    block: { number: 321000 },
    proposalCursor: proposals[1999].id,
    includeActivations: false,
    includeDeactivations: false,
    includeProposals: true,
    includeVotes: false,
  });
});

it("does not request history without an address and current round", async () => {
  const request = jest.fn(() => Observable.of({ data: activePage }));
  const client = createClient(request);
  const { result, rerender } = renderHook(
    ({ delegate, round }: { delegate?: string; round?: string }) =>
      useGovernanceParticipation(delegate, round),
    { wrapper: clientWrapper(client), initialProps: {} }
  );
  expect(result.current).toMatchObject({ treasury: null, loading: false });
  rerender({ delegate: "delegate" });
  expect(request).not.toHaveBeenCalled();
  rerender({ delegate: "delegate", round: "10" });
  await waitFor(() =>
    expect(result.current.treasury).toEqual({ voted: 1, total: 1 })
  );
});

it("hides partial counts when a later page fails", async () => {
  let requestCount = 0;
  const client = createClient(() => {
    requestCount++;
    return new Observable((observer) => {
      if (requestCount === 1) {
        observer.next({
          data: page({
            ...activePage,
            treasuryProposals: Array.from(
              { length: GOVERNANCE_PAGE_SIZE },
              (_, i) => ({
                __typename: "TreasuryProposal" as const,
                id: String(i),
                voteStart: "9",
              })
            ),
          }),
        });
        observer.complete();
      } else {
        observer.error(new Error("network failure"));
      }
    });
  });
  const { result } = renderHook(
    () => useGovernanceParticipation("delegate", "10"),
    {
      wrapper: clientWrapper(client),
    }
  );
  await waitFor(() =>
    expect(result.current.error?.message).toBe("network failure")
  );
  expect(result.current).toMatchObject({ treasury: null, loading: false });
  expect(requestCount).toBe(2);
});

it("does not display the previous address or accept a late result after navigation", async () => {
  const pending: Record<string, (data: GovernanceParticipationQuery) => void> =
    {};
  const client = createClient(
    (operation) =>
      new Observable((observer) => {
        pending[operation.variables.delegate] = (data) => {
          observer.next({ data });
          observer.complete();
        };
      })
  );
  const { result, rerender } = renderHook(
    ({ delegate }) => useGovernanceParticipation(delegate, "10"),
    { wrapper: clientWrapper(client), initialProps: { delegate: "old" } }
  );
  rerender({ delegate: "new" });
  expect(result.current).toMatchObject({ treasury: null, loading: true });
  await act(async () => pending.old(activePage));
  expect(result.current).toMatchObject({ treasury: null, loading: true });
  await act(async () => pending.new(page()));
  expect(result.current).toMatchObject({
    treasury: { voted: 0, total: 0 },
    loading: false,
  });
  rerender({ delegate: "third" });
  expect(result.current).toMatchObject({ treasury: null, loading: true });
});

it("refreshes at a new round and counts voting only after the snapshot", async () => {
  const request = jest.fn(() => Observable.of({ data: activePage }));
  const client = createClient(request);
  const { result, rerender } = renderHook(
    ({ round }) => useGovernanceParticipation("delegate", round),
    { wrapper: clientWrapper(client), initialProps: { round: "9" } }
  );
  await waitFor(() =>
    expect(result.current.treasury).toEqual({ voted: 0, total: 0 })
  );
  rerender({ round: "10" });
  expect(result.current).toMatchObject({ treasury: null, loading: true });
  await waitFor(() =>
    expect(result.current.treasury).toEqual({ voted: 1, total: 1 })
  );
  expect(request).toHaveBeenCalledTimes(2);
});
