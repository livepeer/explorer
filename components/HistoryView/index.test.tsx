/** @jest-environment jsdom */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useTransactionsQuery } from "apollo";
import type { TransactionsQuery } from "apollo/subgraph";
import { ComponentProps } from "react";
import { catIpfsJson } from "utils/ipfs";

import HistoryView from ".";
import type HistoryFilter from "./HistoryFilter";

jest.mock("apollo", () => ({
  ...jest.requireActual("../../apollo/subgraph"),
  useTransactionsQuery: jest.fn(),
}));
jest.mock("next/router", () => ({
  useRouter: () => ({ query: { account: "0xaccount" } }),
}));
jest.mock("lib/chains", () => ({
  DEFAULT_CHAIN_ID: 42161,
  CHAIN_INFO: { 42161: { explorer: "https://arbiscan.io/" } },
}));
jest.mock("hooks", () =>
  jest.requireActual("../../hooks/filter/useHistoryFilter")
);
jest.mock("@lib/api/polls", () => ({
  parsePollIpfs: () => ({ title: "Test poll" }),
}));
jest.mock("@lib/api/treasury", () => ({
  parseProposalText: () => ({ attributes: { title: "Test proposal" } }),
}));
jest.mock("utils/ipfs", () => ({ catIpfsJson: jest.fn() }));
jest.mock("@components/TransactionBadge", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@components/Spinner", () => ({
  __esModule: true,
  default: () => <div role="status">Loading</div>,
}));
jest.mock("@components/HistoryView/HistoryFilter", () => ({
  __esModule: true,
  default: ({
    allEventTypes,
    eventTypeLabels,
    onToggleEventType,
    onClearFilters,
  }: ComponentProps<typeof HistoryFilter>) => (
    <div>
      {allEventTypes.map((eventType) => (
        <button key={eventType} onClick={() => onToggleEventType(eventType)}>
          {eventTypeLabels[eventType]}
        </button>
      ))}
      <button onClick={onClearFilters}>Clear</button>
    </div>
  ),
}));

const emptyPage = (): TransactionsQuery => ({
  __typename: "Query",
  transactions: [],
  winningTicketRedeemedEvents: [],
  rewardEvents: [],
});
const roundTransaction = (
  id: number
): TransactionsQuery["transactions"][number] => ({
  __typename: "Transaction",
  events: [
    {
      __typename: "NewRoundEvent",
      round: { __typename: "Round", id: String(id) },
      transaction: {
        __typename: "Transaction",
        id: `tx-${id}`,
        timestamp: 1000 - id,
      },
    },
  ],
});

let data: TransactionsQuery;
let onIntersect: IntersectionObserverCallback;
const fetchMore = jest.fn();

beforeEach(() => {
  data = emptyPage();
  jest
    .mocked(useTransactionsQuery)
    .mockImplementation(
      () =>
        ({ data, loading: false, fetchMore } as unknown as ReturnType<
          typeof useTransactionsQuery
        >)
    );
  globalThis.IntersectionObserver = jest.fn((callback) => {
    onIntersect = callback;
    return { observe: jest.fn(), disconnect: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
});

it("continues pagination when the loaded page has no matching events", async () => {
  data.transactions = Array.from({ length: 25 }, (_, i) => roundTransaction(i));
  const { rerender } = render(<HistoryView />);
  fireEvent.click(screen.getByRole("button", { name: "Reward Caller Set" }));
  expect(screen.queryAllByText("Initialized round")).toHaveLength(0);
  expect(screen.getByText("No events match the selected filters")).toBeTruthy();

  await act(async () => {
    onIntersect(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  });
  expect(fetchMore).toHaveBeenCalledWith(
    expect.objectContaining({ variables: { skip: 25 } })
  );

  const nextPage = emptyPage();
  nextPage.transactions = [
    {
      __typename: "Transaction",
      events: [
        {
          __typename: "RewardCallerSetEvent",
          rewardCaller: "0x0000000000000000000000000000000000000000",
          round: { __typename: "Round", id: "1" },
          transaction: {
            __typename: "Transaction",
            id: "caller-tx",
            timestamp: 900,
          },
        },
      ],
    },
  ];
  const { updateQuery } = fetchMore.mock.calls[0][0];
  act(() => {
    data = updateQuery(data, { fetchMoreResult: nextPage });
  });
  await act(async () => rerender(<HistoryView />));
  expect(screen.getByText("Removed reward caller")).toBeTruthy();
  expect(screen.queryByText("No events match the selected filters")).toBeNull();
  expect(screen.queryByRole("status")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(screen.getAllByText("Initialized round")).toHaveLength(25);
});

it("keeps loading when rewards have more pages than account transactions", async () => {
  data.transactions = [roundTransaction(0)];
  data.rewardEvents = Array.from({ length: 25 }, (_, i) => ({
    __typename: "RewardEvent",
    id: `reward-${i}`,
    rewardTokens: "1000000000000000000",
    round: { __typename: "Round", id: String(i) },
    transaction: {
      __typename: "Transaction",
      id: `reward-tx-${i}`,
      timestamp: 1100 - i,
    },
    delegate: { __typename: "Transcoder", id: "0xorchestrator" },
  }));
  render(<HistoryView />);
  fireEvent.click(screen.getByRole("button", { name: "Reward" }));
  await act(async () => {
    onIntersect(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    );
  });
  expect(fetchMore).toHaveBeenCalledWith(
    expect.objectContaining({ variables: { skip: 25 } })
  );
  const nextPage = emptyPage();
  nextPage.rewardEvents = data.rewardEvents;
  const { updateQuery } = fetchMore.mock.calls[0][0];
  act(() => {
    updateQuery(data, { fetchMoreResult: nextPage });
  });
  expect(screen.getByRole("status")).toBeTruthy();
});

it("waits for poll metadata before showing an empty filtered history", async () => {
  let resolveIpfs: (value: null) => void = () => {};
  jest.mocked(catIpfsJson).mockReturnValue(
    new Promise((resolve) => {
      resolveIpfs = resolve;
    })
  );
  data.transactions = [
    {
      __typename: "Transaction",
      events: [
        {
          __typename: "VoteEvent",
          id: "vote",
          voter: "0xaccount",
          choiceID: "0",
          timestamp: 1000,
          poll: {
            __typename: "Poll",
            id: "poll",
            proposal: "ipfs-hash",
            endBlock: "1",
            quorum: "1",
            quota: "1",
          },
          transaction: {
            __typename: "Transaction",
            id: "vote-tx",
            timestamp: 1000,
          },
          round: { __typename: "Round", id: "1" },
        },
      ],
    },
  ];
  render(<HistoryView />);
  fireEvent.click(screen.getByRole("button", { name: "Poll Vote" }));
  expect(screen.getByRole("status")).toBeTruthy();
  expect(screen.queryByText("No events match the selected filters")).toBeNull();
  await act(async () => resolveIpfs(null));
  await waitFor(() =>
    expect(screen.getByText('Voted on poll "Test poll"')).toBeTruthy()
  );
  expect(screen.queryByRole("status")).toBeNull();
});
