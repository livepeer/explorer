"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";
import { useReadContracts } from "wagmi";

import { Card, Section, SectionHeader } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { Badge } from "@/components/ui/badge";
import { bondingVotes } from "@/lib/abis/BondingVotes";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { L2_CHAIN } from "@/lib/config";
import { fromWei } from "@/lib/format";
import {
  governorStatesLive,
  hasFailedRead,
  type Holding,
  snapshotHoldings,
  type VoteStatus,
  voteStatus,
} from "@/lib/governance/attention";
import { useGovernance, usePortfolio, useProtocol } from "@/lib/hooks/queries";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";
import type { Poll, TreasuryProposal } from "@/lib/subgraph/network";
import { fetchPollVotes, fetchProposalVotes } from "@/lib/subgraph/votes";

import { PollRow, ProposalRow } from "./list";
import {
  pollEndsAt,
  pollPhase,
  proposalPhaseOnChain,
  proposalWindow,
  toProposalId,
  useControllerContract,
  useL1Block,
} from "./model";
import { TallyKey } from "./tally";

export type ActiveVote = { id: string; closesAt: number } & (
  | { kind: "proposal"; proposal: TreasuryProposal }
  | { kind: "poll"; poll: Poll }
);

/** Votes open right now, treasury proposals and LIP polls, soonest to close. */
export function useOpenVotes() {
  const { data: governance } = useGovernance();
  const { data: protocol } = useProtocol();
  const { block: l1Block } = useL1Block();
  const nowMs = useNow(60_000);
  const governor = useControllerContract("LivepeerGovernor");

  // The governor has the last word on every proposal: the clock can't see a
  // cancellation, and the indexed round can lag behind the chain.
  const readable = useMemo(
    () =>
      (governance?.proposals ?? []).filter((p) => toProposalId(p.id) != null),
    [governance]
  );
  const { data: stateData } = useReadContracts({
    contracts: readable.map((p) => ({
      address: governor,
      abi: livepeerGovernor,
      functionName: "state",
      args: [toProposalId(p.id)!],
      chainId: L2_CHAIN.id,
    })),
    query: {
      enabled: Boolean(governor && readable.length),
      refetchInterval: (q) =>
        governorStatesLive(q.state.data) ? 60_000 : false,
    },
  });
  const chainStates = useMemo(() => {
    const states = new Map<string, number>();
    readable.forEach((p, i) => {
      const read = stateData?.[i];
      if (read?.status === "success") states.set(p.id, Number(read.result));
    });
    return states;
  }, [readable, stateData]);

  const votes = useMemo<ActiveVote[]>(() => {
    if (!governance) return [];
    // Only proposals run on the protocol's round clock; polls use L1 blocks.
    const proposals = protocol
      ? governance.proposals
          // Unread state stays open: better than hiding a live vote.
          .filter(
            (p) =>
              proposalPhaseOnChain(
                p,
                protocol.currentRound,
                chainStates.get(p.id)
              ) === "active"
          )
          .map(
            (proposal): ActiveVote => ({
              id: proposal.id,
              kind: "proposal",
              closesAt: proposalWindow(proposal, protocol).closesAt,
              proposal,
            })
          )
      : [];
    const polls = governance.polls
      .filter((p) => pollPhase(p, l1Block) === "active")
      .map(
        (poll): ActiveVote => ({
          id: poll.id,
          kind: "poll",
          closesAt: pollEndsAt(poll, l1Block, nowMs) ?? 0,
          poll,
        })
      );
    return [...proposals, ...polls].sort((a, b) => a.closesAt - b.closesAt);
  }, [governance, protocol, l1Block, nowMs, chainStates]);

  return { votes, protocol, l1Block, nowMs, chainStates };
}

/** Who has voted on an open vote, kept current while it's on screen. */
export const castVotesQuery = (v: {
  id: string;
  kind: ActiveVote["kind"];
}) => ({
  queryKey: ["votes", v.kind, v.id],
  queryFn: () =>
    v.kind === "poll" ? fetchPollVotes(v.id) : fetchProposalVotes(v.id),
  staleTime: 60_000,
  refetchInterval: 60_000,
});

/**
 * Each open proposal's holdings at its snapshot round, by proposal id. A
 * proposal is missing until every account's snapshot has been read.
 */
export function useSnapshotHoldings(votes: ActiveVote[], accounts: string[]) {
  const bonding = useControllerContract("BondingVotes");
  const proposals = useMemo(
    () =>
      votes.flatMap((v) =>
        v.kind === "proposal" && Number.isSafeInteger(v.proposal.voteStart)
          ? [{ id: v.id, round: BigInt(v.proposal.voteStart) }]
          : []
      ),
    [votes]
  );
  const reads = (functionName: "getPastVotes" | "delegatedAt") =>
    proposals.flatMap((p) =>
      accounts.map((account) => ({
        address: bonding,
        abi: bondingVotes,
        functionName,
        args: [account as `0x${string}`, p.round] as const,
        chainId: L2_CHAIN.id,
      }))
    );
  // A past round's answer never changes, so only failed reads are retried.
  const enabled = Boolean(bonding && proposals.length && accounts.length);
  const { data: power } = useReadContracts({
    contracts: reads("getPastVotes"),
    query: {
      enabled,
      staleTime: Infinity,
      refetchInterval: (q) => (hasFailedRead(q.state.data) ? 60_000 : false),
    },
  });
  const { data: delegates } = useReadContracts({
    contracts: reads("delegatedAt"),
    query: {
      enabled,
      staleTime: Infinity,
      refetchInterval: (q) => (hasFailedRead(q.state.data) ? 60_000 : false),
    },
  });

  return useMemo(() => {
    const out = new Map<string, Holding[]>();
    const size = accounts.length;
    if (!power || !delegates || !size) return out;
    if (power.length !== proposals.length * size) return out;
    if (delegates.length !== power.length) return out;
    proposals.forEach((p, i) => {
      const from = i * size;
      const held = snapshotHoldings(
        accounts,
        power
          .slice(from, from + size)
          .map((r) =>
            r.status === "success" ? (r.result as bigint) : undefined
          ),
        delegates
          .slice(from, from + size)
          .map((r) =>
            r.status === "success" ? (r.result as string) : undefined
          )
      );
      if (held) out.set(p.id, held);
    });
    return out;
  }, [proposals, accounts, power, delegates]);
}

/** Stable, so useQueries shares the combined array between renders. */
const dataOf = <T,>(results: { data?: T }[]) => results.map((r) => r.data);

const CHOICE = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
  yes: "Yes",
  no: "No",
} as const;

function StatusBadge({ status }: { status: VoteStatus }) {
  if (status.kind === "voted") return <Badge tone="positive">You voted</Badge>;
  // The same words, and the same green and amber, as the Portfolio card.
  if (status.kind === "delegate-voted") {
    return (
      <Badge tone="positive">
        Your orchestrator voted {CHOICE[status.choice]} on your behalf
      </Badge>
    );
  }
  if (status.kind === "uncounted") {
    return <Badge tone="warning">Your orchestrator hasn&apos;t voted</Badge>;
  }
  return <Badge tone="warning">You haven&apos;t voted</Badge>;
}

const KEY = [
  { key: "for", label: "For / Yes", color: "var(--series-3)" },
  { key: "against", label: "Against / No", color: "var(--series-2)" },
  { key: "abstain", label: "Abstain", color: "var(--series-other)" },
];

/**
 * Every vote open now, whichever kind, at the top of Governance, each with
 * where the connected wallet's stake stands on it.
 */
export function OpenNow() {
  const { votes, protocol, l1Block, nowMs, chainStates } = useOpenVotes();
  // "You" on these rows is the wallet that would sign, never a saved address.
  const { walletAddress } = usePortfolioAccounts();
  const addresses = useMemo(
    () => (walletAddress ? [walletAddress] : []),
    [walletAddress]
  );
  const { data: portfolio } = usePortfolio(addresses);
  const holdings = useMemo<Holding[]>(
    () =>
      (portfolio?.accounts ?? [])
        // The query keeps its last result while switching wallets.
        .filter((a) => a.id === walletAddress)
        .map((a) => ({
          account: a.id,
          delegate: a.delegate,
          stake: fromWei(a.pendingStake),
        })),
    [portfolio, walletAddress]
  );
  const snapshots = useSnapshotHoldings(votes, addresses);
  // Treasury votes count the stake at the snapshot, polls the current stake.
  const heldFor = (v: ActiveVote) =>
    v.kind === "proposal" ? snapshots.get(v.id) : holdings;
  const casts = useQueries({
    queries: votes.map((v) => ({
      ...castVotesQuery(v),
      enabled: Boolean(heldFor(v)?.some((h) => h.delegate && h.stake > 0)),
    })),
    combine: dataOf,
  });

  if (votes.length === 0) return null;

  // Only a delegator has an orchestrator voting for them.
  const delegating = holdings.some(
    (h) =>
      h.stake > 0 &&
      h.delegate &&
      h.delegate.toLowerCase() !== h.account.toLowerCase()
  );

  return (
    <Section className="mt-0 mb-10">
      <SectionHeader
        title="Open now"
        description={
          delegating
            ? "Your orchestrator's vote counts for your stake unless you vote yourself"
            : "Votes you can take part in, soonest to close first"
        }
        action={<TallyKey series={KEY} />}
      />
      <Card className="divide-y divide-(--hairline) overflow-hidden">
        {votes.map((v, i) => {
          const c = casts[i];
          const held = heldFor(v);
          const status =
            c && held
              ? voteStatus(
                  {
                    id: v.id,
                    kind: v.kind,
                    title: "",
                    closesAt: v.closesAt,
                    casts: c,
                  },
                  held
                )
              : null;
          const context = (
            <>
              <span>
                {v.kind === "poll" ? "LIP poll" : "Treasury proposal"}
              </span>
              {status && <StatusBadge status={status} />}
            </>
          );
          return v.kind === "poll" ? (
            <PollRow
              key={`poll-${v.id}`}
              poll={v.poll}
              l1Block={l1Block}
              nowMs={nowMs}
              context={context}
            />
          ) : (
            protocol && (
              <ProposalRow
                key={`proposal-${v.id}`}
                proposal={v.proposal}
                protocol={protocol}
                nowMs={nowMs}
                chainState={chainStates.get(v.id)}
                context={context}
              />
            )
          );
        })}
      </Card>
    </Section>
  );
}
