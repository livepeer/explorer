"use client";

import { useQueries } from "@tanstack/react-query";
import { ArrowRight, Vote } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { fetchPollDocument, pollTitle } from "@/components/governance/model";
import { useOpenVotes } from "@/components/governance/open-votes";
import { Card } from "@/components/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import {
  type Holding,
  type OpenVote,
  voteAttention,
} from "@/lib/governance/attention";
import {
  type CastVote,
  fetchPollVotes,
  fetchProposalVotes,
} from "@/lib/subgraph/votes";

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

/** Who voted, and which lookups failed: a failed one is still an open vote. */
const castsOf = (results: { data?: CastVote[]; failureCount: number }[]) => ({
  data: results.map((r) => r.data),
  // From the first failure, not after the retries: a vote never goes unseen.
  failed: results.map((r) => r.data === undefined && r.failureCount > 0),
});

/** Open treasury proposals and LIP polls the portfolio's stake is part of. */
export function useVoteInsights(
  holdings: Holding[],
  canManage: (address: string) => boolean
): Insight[] {
  const { votes, nowMs } = useOpenVotes();
  const open = useMemo(
    () =>
      holdings.some((h) => h.delegate)
        ? votes.map((v) => ({
            id: v.id,
            kind: v.kind,
            closesAt: v.closesAt,
            title: v.kind === "proposal" ? v.proposal.title : null,
            poll: v.kind === "poll" ? v.poll : null,
          }))
        : [],
    [votes, holdings]
  );

  const castData = useQueries({
    queries: open.map((v) => ({
      queryKey: ["votes", v.kind, v.id],
      queryFn: () =>
        v.kind === "poll" ? fetchPollVotes(v.id) : fetchProposalVotes(v.id),
      staleTime: 60_000,
    })),
    combine: castsOf,
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
      const c = castData.data[i];
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
    const known = voteAttention(votes, holdings).map((a): Insight => {
      const left = a.vote.closesAt - nowSec;
      const closes =
        left > 0 ? `closes in ~${formatDuration(left)}` : "closing soon";
      const what = a.vote.kind === "poll" ? "LIP poll" : "Treasury proposal";
      const title = <span className="text-foreground">{a.vote.title}</span>;
      // On someone else's account page there's no "you" to ask.
      const yours = canManage(a.account);
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
            cta: yours ? "Review" : "View",
            title: (
              <>
                {insightOrchestrator(a.orchestrator)} voted{" "}
                <span className="text-foreground">{CHOICE[a.choice]}</span> with{" "}
                {yours ? "your" : "this wallet's"} stake on {title}
              </>
            ),
            detail: yours
              ? `${what} ${closes} · Vote yourself to override${others}`
              : `${what} ${closes}${others}`,
          };
        case "nobody-voted":
          return {
            ...base,
            cta: yours ? "Vote" : "View",
            title: (
              <>
                Neither {yours ? "you" : "this wallet"} nor{" "}
                {insightOrchestrator(a.orchestrator)} has voted on {title}
              </>
            ),
            detail: yours
              ? `${what} ${closes} · Your stake only counts once one of you votes${others}`
              : `${what} ${closes} · Its stake only counts once one of them votes${others}`,
          };
        case "orchestrator-not-voted":
          return {
            ...base,
            cta: yours ? "Vote" : "View",
            title: (
              <>
                {insightOrchestrator(a.account)} hasn&apos;t voted on {title}
              </>
            ),
            detail: yours
              ? `${what} ${closes} · Your delegators' stake follows your vote${others}`
              : `${what} ${closes} · Its delegators' stake follows its vote${others}`,
          };
      }
    });
    // Couldn't read who voted: still say it's open, without guessing.
    const staked = holdings.some((h) => h.delegate && h.stake > 0);
    const unread = open.flatMap((v, i): Insight[] => {
      if (!staked || !castData.failed[i]) return [];
      const left = v.closesAt - nowSec;
      const title = v.poll ? pollTitle(v.poll, docData[i]) : v.title!;
      return [
        {
          id: `vote-${v.kind}-${v.id}`,
          kind: "vote",
          tone: left < 2 * DAY ? "warning" : "info",
          cta: "View",
          href:
            v.kind === "poll"
              ? `/governance/polls/${v.id}`
              : `/governance/proposals/${v.id}`,
          title: (
            <>
              <span className="text-foreground">{title}</span> is open for
              voting
            </>
          ),
          detail: `${v.kind === "poll" ? "LIP poll" : "Treasury proposal"} ${
            left > 0 ? `closes in ~${formatDuration(left)}` : "closing soon"
          }`,
        },
      ];
    });
    // Soonest to close first, as `open` is.
    const order = new Map(open.map((v, i) => [`vote-${v.kind}-${v.id}`, i]));
    return [...known, ...unread].sort(
      (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)
    );
  }, [open, holdings, canManage, nowMs, castData, docData]);
}

/** How many votes show before the rest fold into a link. */
const SHOWN = 2;

/** Open votes, leading the page from the moment they open. */
export function OpenVoteCard({ items }: { items: Insight[] }) {
  if (!items.length) return null;
  const more = items.length - SHOWN;
  return (
    <Card className="mb-5 divide-y divide-(--hairline) overflow-hidden">
      {items.slice(0, SHOWN).map((i) => (
        <div key={i.id} className="flex items-center gap-3 px-4 py-3">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full",
              i.tone === "warning"
                ? "bg-warm-subtle text-warm"
                : "bg-green-subtle text-green-bright"
            )}
          >
            <Vote className="size-3.5" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-ui-body text-muted-foreground">{i.title}</p>
            <p className="text-ui-caption text-subtle-foreground">{i.detail}</p>
          </div>
          <Button size="sm" render={<Link href={i.href!} />}>
            {i.cta}
          </Button>
        </div>
      ))}
      {more > 0 && (
        <Link
          href="/governance"
          className="flex items-center justify-center gap-1 px-4 py-2 text-ui-caption text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
          {more} more open {more === 1 ? "vote" : "votes"}{" "}
          <ArrowRight className="size-3" />
        </Link>
      )}
    </Card>
  );
}
