"use client";

import { useQueries } from "@tanstack/react-query";
import { ArrowRight, Vote } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo } from "react";

import { fetchPollDocument, pollTitle } from "@/components/governance/model";
import {
  castVotesQuery,
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

/** A vote where stake isn't counted yet: worth leading the page. */
export type VotePrompt = {
  id: string;
  href: string;
  title: string;
  closes: string;
  message: React.ReactNode;
  /** What can be done from here, given which wallet is connected. */
  action: "vote" | "connect" | "switch";
};

/** A vote with nothing to do, or whose status isn't known: a quiet line. */
export type VoteNote = { id: string; message: React.ReactNode };

const linkClass =
  "text-foreground underline-offset-2 outline-none hover:underline focus-visible:underline";

/**
 * Open votes for the wallets in the portfolio, by what they need: `prompts`
 * where stake isn't counted yet, `notes` where it is. Accounts outside the
 * portfolio get neither: the nav count and Governance cover those.
 */
export function useVoteInsights(
  holdings: Holding[],
  accounts: string[],
  canManage: (address: string) => boolean
): { prompts: VotePrompt[]; notes: VoteNote[] } {
  const { votes, nowMs } = useOpenVotes();
  const mineKey = accounts.filter(canManage).join(",");
  const mine = useMemo(() => (mineKey ? mineKey.split(",") : []), [mineKey]);
  const held = useMemo(
    () => holdings.filter((h) => mine.includes(h.account)),
    [holdings, mine]
  );
  const snapshots = useSnapshotHoldings(votes, mine);
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
      v.kind === "proposal" ? snapshots.get(v.id) : held,
    [snapshots, held]
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
    const prompts: VotePrompt[] = [];
    const notes: VoteNote[] = [];
    const nowSec = nowMs / 1000;
    const stakedNow = held.some(isStaked);
    // Soonest to close first, as `open` is.
    open.forEach((v, i) => {
      const id = `vote-${v.kind}-${v.id}`;
      const href =
        v.kind === "poll"
          ? `/governance/polls/${v.id}`
          : `/governance/proposals/${v.id}`;
      const title = v.poll ? pollTitle(v.poll, docData[i]) : v.title!;
      const left = v.closesAt - nowSec;
      const closes =
        left > 0 ? `closes in ~${formatDuration(left)}` : "closing soon";
      const titleLink = (
        <Link href={href} className={linkClass}>
          {title}
        </Link>
      );
      const casts = castData[i];
      const who = heldFor(v);
      if (!casts || !who) {
        // Still reading who voted, or couldn't: it's open either way.
        if (who ? who.some(isStaked) : stakedNow) {
          notes.push({
            id,
            message: (
              <>
                {titleLink} is open for voting · {closes}
              </>
            ),
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
        notes.push({
          id,
          message: (
            <DelegateVoted
              a={a}
              yours={yours}
              several={mine.length > 1}
              // The orchestrator named just above, unless it's since changed.
              sameAsShown={
                mine.length === 1 &&
                held[0]?.delegate?.toLowerCase() === a.orchestrator
              }
              title={titleLink}
              closes={closes}
              href={href}
            />
          ),
        });
        return;
      }
      prompts.push({
        id,
        href,
        title,
        closes,
        action: yours ? "vote" : walletAddress ? "switch" : "connect",
        message: <Uncounted a={a} yours={yours} several={mine.length > 1} />,
      });
    });
    return { prompts, notes };
  }, [open, mine, held, heldFor, walletAddress, nowMs, castData, docData]);
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
        {insightOrchestrator(a.orchestrator)} has voted, so{" "}
        {yours ? "your" : "its"} stake isn&apos;t counted{also}
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
function DelegateVoted({
  a,
  yours,
  several,
  sameAsShown,
  title,
  closes,
  href,
}: {
  a: Extract<VoteAttention, { reason: "delegate-voted" }>;
  yours: boolean;
  several: boolean;
  sameAsShown: boolean;
  title: React.ReactNode;
  closes: string;
  href: string;
}) {
  const choice = <span className="text-foreground">{CHOICE[a.choice]}</span>;
  return (
    <>
      {sameAsShown ? (
        <>Voted {choice} on </>
      ) : (
        <>
          {insightOrchestrator(a.orchestrator)} voted {choice} with{" "}
          {yours ? (
            "your"
          ) : several ? (
            <>{insightOrchestrator(a.account)}&apos;s</>
          ) : (
            "this wallet's"
          )}{" "}
          stake on{" "}
        </>
      )}
      {title} · {closes}
      {yours && (
        <>
          {" · "}
          <Link href={href} className={linkClass}>
            Vote yourself to override
          </Link>
        </>
      )}
    </>
  );
}

/** How many prompts show before the rest fold into a link. */
const SHOWN = 2;

function PromptAction({ item }: { item: VotePrompt }) {
  const connect = useConnectWallet();
  if (item.action === "vote") {
    return (
      <Button size="sm" variant="primary" render={<Link href={item.href} />}>
        Vote
      </Button>
    );
  }
  return (
    <Button size="sm" variant="primary" onClick={connect}>
      {item.action === "switch" ? "Switch wallet" : "Connect to vote"}
    </Button>
  );
}

/** Votes where stake isn't counted yet, leading the page. */
export function OpenVoteCard({ items }: { items: VotePrompt[] }) {
  if (!items.length) return null;
  const more = items.length - SHOWN;
  return (
    <Card className="mb-5 divide-y divide-(--hairline) overflow-hidden">
      {items.slice(0, SHOWN).map((i) => (
        <div
          key={i.id}
          className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="flex items-center gap-1.5 text-ui-caption font-medium text-warm">
              <Vote className="size-3.5 shrink-0" />
              Open vote · {i.closes}
            </p>
            <Link
              href={i.href}
              className="text-ui-body font-medium text-foreground underline-offset-2 outline-none hover:underline focus-visible:underline"
            >
              {i.title}
            </Link>
            <p className="text-ui-caption text-muted-foreground">{i.message}</p>
          </div>
          <PromptAction item={i} />
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

/** Votes with nothing to do: one quiet line, the rest behind a link. */
export function OpenVoteNotes({
  items,
  className,
}: {
  items: VoteNote[];
  className?: string;
}) {
  if (!items.length) return null;
  const more = items.length - 1;
  return (
    <p
      className={cn(
        "min-w-0 text-ui-caption leading-5 text-muted-foreground",
        className
      )}
    >
      {items[0].message}
      {more > 0 && (
        <>
          {" · "}
          <Link href="/governance" className={linkClass}>
            {more} more open {more === 1 ? "vote" : "votes"}
          </Link>
        </>
      )}
    </p>
  );
}
