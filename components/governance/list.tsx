"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { Identity } from "@/components/identity";
import { Card } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Skeleton, StatusDot } from "@/components/ui/misc";
import { formatPercent } from "@/lib/format";
import type { Poll, Protocol, TreasuryProposal } from "@/lib/subgraph/network";

import {
  pollEndsAt,
  pollMajority,
  type PollPhase,
  pollPhase,
  pollTitle,
  proposalDocument,
  proposalMajority,
  proposalPhase,
  proposalWindow,
  timeCopy,
  usePollDocument,
} from "./model";
import {
  pollSeries,
  proposalSeries,
  TallyBar,
  type TallySeries,
} from "./tally";

/* ── Row chrome ──────────────────────────────────────────────────────────── */

function Row({
  href,
  active,
  title,
  badge,
  meta,
  series,
  share,
}: {
  href: string;
  active: boolean;
  title: React.ReactNode;
  badge: React.ReactNode;
  meta: React.ReactNode;
  series: TallySeries[];
  share: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-4 py-4 transition-colors outline-none hover:bg-hover focus-visible:bg-hover sm:px-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-w-0 items-center gap-2">
            {active && <StatusDot pulse />}
            <span className="truncate text-ui-body font-medium text-foreground">
              {title}
            </span>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-ui-caption text-muted-foreground">
            {badge}
            {meta}
          </div>
        </div>
        <div className="flex w-full shrink-0 items-center gap-3 sm:w-48">
          <TallyBar series={series} className="h-1.5 flex-1" />
          <span className="w-16 shrink-0 text-right font-mono text-ui-caption text-muted-foreground tabular-nums">
            {share}
          </span>
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-colors group-hover:text-foreground" />
    </Link>
  );
}

function leadingShare(series: TallySeries[]) {
  const sum = series.reduce((s, x) => s + x.value, 0);
  if (sum <= 0) return "—";
  return `${formatPercent((series[0].value / sum) * 100, {
    decimals: 0,
  })} ${series[0].label.toLowerCase()}`;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="divide-y divide-(--hairline)">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-5"
        >
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-3/4 max-w-[420px]" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-1.5 w-full sm:w-48" />
        </div>
      ))}
    </Card>
  );
}

/* ── Treasury proposals ──────────────────────────────────────────────────── */

export function ProposalRow({
  proposal,
  protocol,
  nowMs,
}: {
  proposal: TreasuryProposal;
  protocol: Protocol;
  nowMs: number;
}) {
  const phase = proposalPhase(proposal, protocol.currentRound);
  const { opensAt, closesAt } = proposalWindow(proposal, protocol);
  const outcome = proposalMajority(proposal);
  const series = proposalSeries(proposal);
  const { title } = proposalDocument(proposal.description);

  const badge =
    phase === "active" ? (
      <Badge tone="positive">Active</Badge>
    ) : phase === "pending" ? (
      <Badge>Pending</Badge>
    ) : (
      <Badge tone={outcome.tone}>{outcome.label}</Badge>
    );

  return (
    <Row
      href={`/governance/proposals/${proposal.id}`}
      active={phase === "active"}
      title={title}
      badge={badge}
      meta={
        <>
          <span className="max-w-[180px]">
            <Identity
              address={proposal.proposer}
              href={null}
              size={16}
              className="[&_span]:text-ui-caption"
            />
          </span>
          <span>
            {timeCopy(phase, phase === "pending" ? opensAt : closesAt, nowMs)}
          </span>
        </>
      }
      series={series}
      share={leadingShare(series)}
    />
  );
}

/* ── LIP polls ───────────────────────────────────────────────────────────── */

export function PollRow({
  poll,
  l1Block,
  nowMs,
}: {
  poll: Poll;
  l1Block: number | null;
  nowMs: number;
}) {
  const { data: doc } = usePollDocument(poll.proposal);
  const phase: PollPhase = pollPhase(poll, l1Block);
  const endsAt = pollEndsAt(poll, l1Block, nowMs);
  const outcome = pollMajority(poll);
  const series = pollSeries(poll);

  const badge =
    phase === "active" ? (
      <Badge tone="positive">Active</Badge>
    ) : phase === "ended" ? (
      <Badge tone={outcome.tone}>{outcome.label}</Badge>
    ) : null;

  return (
    <Row
      href={`/governance/polls/${poll.id}`}
      active={phase === "active"}
      title={pollTitle(poll, doc)}
      badge={badge}
      meta={
        <>
          <span>
            {endsAt != null && phase !== "unknown"
              ? timeCopy(phase, endsAt, nowMs)
              : `Ends at block ${poll.endBlock.toLocaleString()}`}
          </span>
          <span>
            {poll.voteCount.toLocaleString()}{" "}
            {poll.voteCount === 1 ? "voter" : "voters"}
          </span>
        </>
      }
      series={series}
      share={leadingShare(series)}
    />
  );
}
