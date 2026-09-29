"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo } from "react";

import {
  fetchPollDocument,
  pollEndsAt,
  pollPhase,
  pollTitle,
  proposalPhase,
  proposalWindow,
  useL1Block,
} from "@/components/governance/model";
import { useNow } from "@/components/shell/round-clock";
import { formatDuration } from "@/lib/format";
import {
  type Holding,
  type OpenVote,
  voteAttention,
} from "@/lib/governance/attention";
import { useGovernance, useProtocol } from "@/lib/hooks/queries";
import { fetchPollVotes, fetchProposalVotes } from "@/lib/subgraph/votes";

import { type Insight, insightOrchestrator } from "./side-panels";

const CHOICE = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
  yes: "Yes",
  no: "No",
} as const;

const DAY = 86_400;

/** Stable, so useQueries shares the combined array between renders. */
const dataOf = <T,>(results: { data?: T }[]) => results.map((r) => r.data);

/** Open treasury proposals and LIP polls the portfolio's stake is part of. */
export function useVoteInsights(holdings: Holding[]): Insight[] {
  const { data: governance } = useGovernance();
  const { data: protocol } = useProtocol();
  const { block: l1Block } = useL1Block();
  const nowMs = useNow(60_000);

  const open = useMemo(() => {
    if (!governance || !protocol || !holdings.some((h) => h.delegate))
      return [];
    const proposals = governance.proposals
      .filter((p) => proposalPhase(p, protocol.currentRound) === "active")
      .map((p) => ({
        id: p.id,
        kind: "proposal" as const,
        closesAt: proposalWindow(p, protocol).closesAt,
        title: p.title,
        poll: null,
      }));
    const polls = governance.polls
      .filter((p) => pollPhase(p, l1Block) === "active")
      .map((p) => ({
        id: p.id,
        kind: "poll" as const,
        closesAt: pollEndsAt(p, l1Block, nowMs) ?? 0,
        title: null,
        poll: p,
      }));
    return [...proposals, ...polls];
  }, [governance, protocol, l1Block, nowMs, holdings]);

  const castData = useQueries({
    queries: open.map((v) => ({
      queryKey: ["votes", v.kind, v.id],
      queryFn: () =>
        v.kind === "poll" ? fetchPollVotes(v.id) : fetchProposalVotes(v.id),
      staleTime: 60_000,
    })),
    combine: dataOf,
  });
  const docData = useQueries({
    queries: open.map((v) => ({
      queryKey: ["poll-document", v.poll?.proposal],
      queryFn: () => fetchPollDocument(v.poll!.proposal),
      enabled: Boolean(v.poll?.proposal),
      staleTime: Infinity,
      gcTime: Infinity,
      retry: 1,
    })),
    combine: dataOf,
  });

  return useMemo(() => {
    const votes: OpenVote[] = [];
    open.forEach((v, i) => {
      const c = castData[i];
      if (!c) return;
      votes.push({
        id: v.id,
        kind: v.kind,
        closesAt: v.closesAt,
        casts: c,
        title: v.poll ? pollTitle(v.poll, docData[i]) : v.title!,
      });
    });
    const nowSec = nowMs / 1000;
    return voteAttention(votes, holdings).map((a): Insight => {
      const left = a.vote.closesAt - nowSec;
      const closes =
        left > 0 ? `closes in ~${formatDuration(left)}` : "closing soon";
      const what = a.vote.kind === "poll" ? "LIP poll" : "Treasury proposal";
      const title = <span className="text-foreground">{a.vote.title}</span>;
      const others =
        a.others > 0
          ? ` · ${a.others} more wallet${
              a.others === 1 ? " hasn't" : "s haven't"
            } voted`
          : "";
      const base = {
        id: `vote-${a.vote.kind}-${a.vote.id}`,
        kind: "vote" as const,
        href:
          a.vote.kind === "poll"
            ? `/governance/polls/${a.vote.id}`
            : `/governance/proposals/${a.vote.id}`,
        tone: left < 2 * DAY ? ("warning" as const) : ("info" as const),
      };
      switch (a.reason) {
        case "delegate-voted":
          return {
            ...base,
            // Nothing is wrong: the vote counts. Worth knowing, not urgent.
            tone: "info",
            title: (
              <>
                {insightOrchestrator(a.orchestrator)} voted{" "}
                <span className="text-foreground">{CHOICE[a.choice]}</span> with
                your stake on {title}
              </>
            ),
            detail: `${what} ${closes} · Vote yourself to override${others}`,
          };
        case "nobody-voted":
          return {
            ...base,
            title: (
              <>
                Neither you nor {insightOrchestrator(a.orchestrator)} has voted
                on {title}
              </>
            ),
            detail: `${what} ${closes} · Your stake only counts once one of you votes${others}`,
          };
        case "orchestrator-not-voted":
          return {
            ...base,
            title: (
              <>
                {insightOrchestrator(a.account)} hasn&apos;t voted on {title}
              </>
            ),
            detail: `${what} ${closes} · Your delegators' stake follows your vote${others}`,
          };
      }
    });
  }, [open, holdings, nowMs, castData, docData]);
}
