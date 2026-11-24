"use client";

import { useQueries } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronRight, Vote } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";

import { fetchPollDocument, pollTitle } from "@/components/governance/model";
import {
  castVotesQuery,
  useCurrentHoldings,
  useOpenVotes,
  useSnapshotHoldings,
} from "@/components/governance/open-votes";
import { Card } from "@/components/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDuration } from "@/lib/format";
import {
  type Holding,
  leadVoteAttention,
  type VoteAttention,
} from "@/lib/governance/attention";
import { useConnectWallet } from "@/lib/hooks/connect";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";

import { insightOrchestrator } from "./side-panels";

const CHOICE = {
  for: "For",
  against: "Against",
  abstain: "Abstain",
  yes: "Yes",
  no: "No",
} as const;

/** Stable, so useQueries shares the combined array between renders. */
const dataOf = <T,>(results: { data?: T }[]) => results.map((r) => r.data);

const isStaked = (h: Holding) => Boolean(h.delegate) && h.stake > 0;

/** One open vote, and where the portfolio's stake stands on it. */
export type VoteItem = {
  id: string;
  href: string;
  title: string;
  /** "Treasury proposal closes in ~5d". */
  when: string;
  /**
   * `uncounted`: nobody has voted with this stake, so someone needs to.
   * `counted`: an orchestrator's vote carries it. `unknown`: couldn't tell.
   */
  standing: "uncounted" | "counted" | "unknown";
  message: React.ReactNode;
  /** What can be done from here, given which wallet is connected. */
  action: "vote" | "connect" | "switch" | "review" | "view";
};

/**
 * Open votes for the wallets in the portfolio, those that need someone
 * first. Accounts outside the portfolio get none: the nav count and
 * Governance cover those.
 */
export function useVoteInsights(
  holdings: Holding[],
  accounts: string[],
  canManage: (address: string) => boolean
): VoteItem[] {
  const { votes, nowMs } = useOpenVotes();
  const mineKey = accounts.filter(canManage).join(",");
  const mine = useMemo(() => (mineKey ? mineKey.split(",") : []), [mineKey]);
  const held = useMemo(
    () => holdings.filter((h) => mine.includes(h.account)),
    [holdings, mine]
  );
  const snapshots = useSnapshotHoldings(votes, mine);
  const current = useCurrentHoldings(mine, votes);
  // Votes are signed by the connected wallet: a saved address isn't "you".
  const { walletAddress } = usePortfolioAccounts();
  const open = useMemo(
    () =>
      mine.length
        ? votes.map((v) => ({
            id: v.id,
            kind: v.kind,
            closesAt: v.closesAt,
            title: v.kind === "proposal" ? v.proposal.title : null,
            poll: v.kind === "poll" ? v.poll : null,
          }))
        : [],
    [votes, mine]
  );
  // Treasury votes count the stake at the snapshot, polls the current stake.
  const heldFor = useCallback(
    (v: { id: string; kind: "proposal" | "poll" }) =>
      v.kind === "proposal" ? snapshots.get(v.id) : current ?? held,
    [snapshots, current, held]
  );

  const castData = useQueries({
    queries: open.map((v) => ({
      ...castVotesQuery(v),
      enabled: Boolean(heldFor(v)?.some(isStaked)),
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
    const items: VoteItem[] = [];
    const nowSec = nowMs / 1000;
    const several = mine.length > 1;
    open.forEach((v, i) => {
      const left = v.closesAt - nowSec;
      const title = v.poll ? pollTitle(v.poll, docData[i]) : v.title!;
      const base = {
        id: `vote-${v.kind}-${v.id}`,
        href:
          v.kind === "poll"
            ? `/governance/polls/${v.id}`
            : `/governance/proposals/${v.id}`,
        title,
        when: `${v.kind === "poll" ? "LIP poll" : "Treasury proposal"} ${
          left > 0 ? `closes in ~${formatDuration(left)}` : "closing soon"
        }`,
      };
      const casts = castData[i];
      const who = heldFor(v);
      if (!casts || !who) {
        // Still reading who voted, or couldn't: it's open either way. With no
        // snapshot, today's stake can't rule a wallet out: it may have
        // unstaked since, and could still vote.
        if (!who || who.some(isStaked)) {
          items.push({
            ...base,
            standing: "unknown",
            message: "Open for voting",
            action: "view",
          });
        }
        return;
      }
      const a = leadVoteAttention(
        { id: v.id, kind: v.kind, closesAt: v.closesAt, casts, title },
        who,
        walletAddress
      );
      if (!a) return;
      const yours = a.account === walletAddress;
      if (a.reason === "delegate-voted") {
        items.push({
          ...base,
          standing: "counted",
          message: <Counted a={a} yours={yours} several={several} />,
          action: yours ? "review" : "view",
        });
        return;
      }
      items.push({
        ...base,
        standing: "uncounted",
        message: <Uncounted a={a} yours={yours} several={several} />,
        action: yours ? "vote" : walletAddress ? "switch" : "connect",
      });
    });
    // What needs someone first; within that, soonest to close, as `open` is.
    const rank = (i: VoteItem) => (i.standing === "uncounted" ? 0 : 1);
    return items.sort((a, b) => rank(a) - rank(b));
  }, [open, mine, heldFor, walletAddress, nowMs, castData, docData]);
}

/** Why a vote needs someone, for a wallet whose stake isn't counted. */
function Uncounted({
  a,
  yours,
  several,
}: {
  a: VoteAttention;
  yours: boolean;
  several: boolean;
}) {
  const wallet = several ? insightOrchestrator(a.account) : "this wallet";
  const also =
    a.others > 0
      ? ` · ${a.others} more wallet${a.others === 1 ? "" : "s"} not counted`
      : "";
  if (a.reason === "nobody-voted") {
    return (
      <>
        Neither {yours ? "you" : wallet} nor{" "}
        {insightOrchestrator(a.orchestrator)} has voted. Vote now, or{" "}
        {yours ? "your" : "its"} stake follows theirs if they do{also}
      </>
    );
  }
  return yours ? (
    <>
      You haven&apos;t voted, and your delegators&apos; stake follows you{also}
    </>
  ) : (
    <>
      {several ? wallet : "This wallet"} hasn&apos;t voted, and its
      delegators&apos; stake follows its vote{also}
    </>
  );
}

/** How an orchestrator's vote carried this stake. */
function Counted({
  a,
  yours,
  several,
}: {
  a: Extract<VoteAttention, { reason: "delegate-voted" }>;
  yours: boolean;
  several: boolean;
}) {
  return (
    <>
      {insightOrchestrator(a.orchestrator)} voted{" "}
      <span className="text-foreground">{CHOICE[a.choice]}</span> on{" "}
      {yours ? (
        "your behalf. Vote yourself to override"
      ) : (
        <>
          {several ? (
            <>{insightOrchestrator(a.account)}&apos;s</>
          ) : (
            "this wallet's"
          )}{" "}
          behalf. Vote from that wallet to override
        </>
      )}
    </>
  );
}

/** How many votes show before the rest fold into a link. */
const SHOWN = 2;

const MARK = {
  uncounted: { icon: Vote, className: "bg-warm-subtle text-warm" },
  counted: { icon: Check, className: "bg-green-subtle text-green-bright" },
  unknown: { icon: Vote, className: "bg-hover text-muted-foreground" },
};

function VoteAction({ item }: { item: VoteItem }) {
  const connect = useConnectWallet();
  switch (item.action) {
    case "vote":
      return (
        <Button size="sm" variant="primary" render={<Link href={item.href} />}>
          Vote
        </Button>
      );
    case "connect":
    case "switch":
      return (
        <Button size="sm" variant="primary" onClick={connect}>
          {item.action === "switch" ? "Switch wallet" : "Connect to vote"}
        </Button>
      );
    default:
      // Nothing to do: a way in, not a call to action. The title links too,
      // so phones do without it.
      return (
        <Button
          size="sm"
          variant="ghost"
          className="hidden sm:inline-flex"
          render={<Link href={item.href} />}
        >
          {item.action === "review" ? "Review" : "View"}
          <ChevronRight className="size-3.5" />
        </Button>
      );
  }
}

/**
 * Open votes and where the portfolio's stake stands on each: one card, in
 * one place, above the balance. A vote that needs someone is marked and
 * carries the button; one already counted is the same row, quieter.
 */
export function OpenVotes({ items }: { items: VoteItem[] }) {
  if (!items.length) return null;
  const more = items.length - SHOWN;
  return (
    <Card
      aria-label="Open votes"
      className="mb-5 divide-y divide-(--hairline) overflow-hidden"
    >
      {items.slice(0, SHOWN).map((i) => {
        const { icon: Icon, className } = MARK[i.standing];
        return (
          <div
            key={i.id}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full",
                  className
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Link
                  href={i.href}
                  className="text-ui-body font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:underline sm:truncate"
                >
                  {i.title}
                </Link>
                <p className="text-ui-caption text-muted-foreground">
                  {i.message} · {i.when}
                </p>
              </div>
            </div>
            <VoteAction item={i} />
          </div>
        );
      })}
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
