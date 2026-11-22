"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import { Card, Section, SectionHeader } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { Badge } from "@/components/ui/badge";
import { fromWei } from "@/lib/format";
import {
  type Holding,
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
  proposalPhase,
  proposalWindow,
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

  const votes = useMemo<ActiveVote[]>(() => {
    if (!governance || !protocol) return [];
    const proposals = governance.proposals
      .filter((p) => proposalPhase(p, protocol.currentRound) === "active")
      .map(
        (proposal): ActiveVote => ({
          id: proposal.id,
          kind: "proposal",
          closesAt: proposalWindow(proposal, protocol).closesAt,
          proposal,
        })
      );
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
  }, [governance, protocol, l1Block, nowMs]);

  return { votes, protocol, l1Block, nowMs };
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
  if (status.kind === "delegate-voted") {
    return <Badge>Your orchestrator voted {CHOICE[status.choice]}</Badge>;
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
 * where the portfolio's stake stands on it.
 */
export function OpenNow() {
  const { votes, protocol, l1Block, nowMs } = useOpenVotes();
  const { accounts } = usePortfolioAccounts();
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const { data: portfolio } = usePortfolio(addresses);
  const holdings = useMemo<Holding[]>(
    () =>
      (portfolio?.accounts ?? []).map((a) => ({
        account: a.id,
        delegate: a.delegate,
        stake: fromWei(a.pendingStake),
      })),
    [portfolio]
  );
  const staked = holdings.some((h) => h.delegate && h.stake > 0);
  const casts = useQueries({
    queries: votes.map((v) => ({
      queryKey: ["votes", v.kind, v.id],
      queryFn: () =>
        v.kind === "poll" ? fetchPollVotes(v.id) : fetchProposalVotes(v.id),
      enabled: staked,
      staleTime: 60_000,
    })),
    combine: dataOf,
  });

  if (!protocol || votes.length === 0) return null;

  return (
    <Section className="mt-0 mb-10">
      <SectionHeader
        title="Open now"
        description="Votes you can take part in, soonest to close first"
        action={<TallyKey series={KEY} />}
      />
      <Card className="divide-y divide-(--hairline) overflow-hidden">
        {votes.map((v, i) => {
          const c = casts[i];
          const status = c
            ? voteStatus(
                {
                  id: v.id,
                  kind: v.kind,
                  title: "",
                  closesAt: v.closesAt,
                  casts: c,
                },
                holdings
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
            <ProposalRow
              key={`proposal-${v.id}`}
              proposal={v.proposal}
              protocol={protocol}
              nowMs={nowMs}
              context={context}
            />
          );
        })}
      </Card>
    </Section>
  );
}
