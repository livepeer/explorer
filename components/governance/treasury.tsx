"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useReadContracts } from "wagmi";

import { TimeSeriesChart } from "@/components/charts/time-series";
import { Card, ErrorNotice } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { InlineSkeleton, Skeleton, StatusDot } from "@/components/ui/misc";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { cn } from "@/lib/cn";
import { L2_CHAIN } from "@/lib/config";
import {
  formatDate,
  formatLPT,
  formatPercent,
  formatToken,
  formatUSD,
} from "@/lib/format";
import { treasuryStats } from "@/lib/governance/treasury-stats";
import {
  useGovernance,
  usePrices,
  useProtocol,
  useTreasury,
} from "@/lib/hooks/queries";
import { useProtocolContract } from "@/lib/staking/contracts";
import { treasuryPace } from "@/lib/treasury-model";

/** Recent rounds the pace is averaged over. */
const PACE_ROUNDS = 30;

/** The card's chart, as tall as the figures beside it. */
const CHART_HEIGHT = 256;

/** "LPT" quieter than the number, as elsewhere. */
function Lpt({ value, compact }: { value: number; compact?: boolean }) {
  return (
    <>
      {formatToken(value, { compact })}
      <span className="text-muted-foreground"> LPT</span>
    </>
  );
}

/** One labelled figure in the card's grid. */
function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-ui-caption text-muted-foreground">{label}</dt>
      <dd className="truncate text-ui-body">{children}</dd>
    </div>
  );
}

/** How full: the bar ends at the ceiling. */
function FillMeter({
  balance,
  ceiling,
  share,
  pill = false,
  className,
}: {
  balance: number;
  ceiling: number;
  share: number;
  /**
   * Fully rounded, to match the Network page's other bars. Always the series
   * blue: an amount, like its chart, where green would mean "healthy".
   */
  pill?: boolean;
  className?: string;
}) {
  return (
    <div
      role="meter"
      aria-label="Treasury balance towards its ceiling"
      aria-valuemin={0}
      aria-valuemax={ceiling}
      aria-valuenow={Math.min(balance, ceiling)}
      aria-valuetext={`${formatLPT(balance)} of ${formatLPT(ceiling)}`}
      className={cn(
        "h-1.5 w-full overflow-hidden",
        pill
          ? "rounded-full bg-foreground/[0.08]"
          : "rounded-[2px] bg-foreground/[0.06]",
        className
      )}
    >
      <span
        className={cn(
          "block h-full",
          "bg-(--series-1)",
          pill ? "rounded-full" : "rounded-[2px]"
        )}
        style={{ width: `${share * 100}%` }}
      />
    </div>
  );
}

/** The treasury with its pace and status worked out, once both load. */
function useTreasuryView() {
  const treasury = useTreasury();
  const protocol = useProtocol();
  const nowSec = useNow(60_000) / 1000;
  const t = treasury.data;
  const p = protocol.data;
  if (!t || !p) return { treasury, view: null };

  const recent = p.recentRounds.slice(-PACE_ROUNDS);
  const mintable = recent.length
    ? recent.reduce((s, r) => s + r.mintableTokens, 0) / recent.length
    : 0;
  const pace = treasuryPace(t, mintable, p.roundSeconds, nowSec);
  const share = t.ceiling > 0 ? Math.min(1, t.balance / t.ceiling) : 0;
  const cutPct = formatPercent(t.nextCut * 100, { decimals: 0 });

  const status = pace.full
    ? {
        tone: "neutral" as const,
        label: "Full",
        detail: "The cut is off until governance sets it again",
      }
    : pace.perRound > 0
    ? {
        tone: "positive" as const,
        label: "Filling",
        detail: `${cutPct} of rewards each round`,
      }
    : {
        tone: "warning" as const,
        label: "Not filling",
        detail: "The reward cut is 0%",
      };
  const fullBy = pace.full
    ? "Ceiling reached"
    : "fullAt" in pace && pace.fullAt
    ? `~${formatDate(pace.fullAt, { month: "short", year: "numeric" })}`
    : "—";

  return {
    treasury,
    view: { t, pace, share, cutPct, status, fullBy },
  };
}

/**
 * The treasury's record: what its proposals have paid out, how often they
 * pass, and what's being asked for now. Each proposal's state is read from
 * the governor in one batch (the subgraph doesn't index it); null until
 * that loads.
 */
function useTreasuryRecord() {
  const governor = useProtocolContract("LivepeerGovernor");
  const proposals = useGovernance().data?.proposals;
  const states = useReadContracts({
    contracts: (proposals ?? []).map((p) => ({
      address: governor,
      abi: livepeerGovernor,
      functionName: "state",
      args: [BigInt(p.id)],
      chainId: L2_CHAIN.id,
    })),
    query: { enabled: Boolean(governor && proposals?.length) },
  });
  if (!proposals || !states.data) return null;
  return treasuryStats(
    proposals.map((p, i) => ({
      actions: p.actions,
      state:
        states.data[i]?.status === "success"
          ? Number(states.data[i].result)
          : undefined,
    }))
  );
}

/**
 * The treasury against its ceiling: how much it holds, its history, and at
 * the current reward cut how fast it's filling and when it will be full.
 * Once full, the cut switches off and it stops filling until governance
 * sets one again.
 */
export function TreasuryCard() {
  const { treasury, view: v } = useTreasuryView();
  // Proposals are talked about in dollars, so the balance shows its rough
  // USD value at today's price; left out until (or unless) a price loads.
  const lptUsd = usePrices().data?.lpt;
  const record = useTreasuryRecord();
  if (treasury.error)
    return (
      <ErrorNotice error={treasury.error} onRetry={() => treasury.refetch()} />
    );
  // While loading, the card itself with gaps where its figures go: the same
  // layout, so it's the same height and nothing moves when they arrive.
  const ceiling = v && formatLPT(v.t.ceiling, { compact: true });

  return (
    // Numbers beside the chart on wide screens, above it on narrow ones.
    // Side by side, the balance lines up with the chart's top and the bar
    // and status with its baseline.
    <Card className="grid gap-6 p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-0">
      <div className="flex flex-col justify-between gap-6 lg:border-r lg:border-hairline lg:pr-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-ui-caption text-muted-foreground">
              Treasury balance
            </span>
            <span className="text-[28px] leading-9 font-light tracking-[-0.02em] tabular-nums">
              {v ? (
                <Lpt value={v.t.balance} />
              ) : (
                <InlineSkeleton className="h-7 w-48" />
              )}
            </span>
            <span className="text-ui-caption text-muted-foreground">
              {v ? (
                <>
                  {lptUsd != null && (
                    <>
                      ≈ {formatUSD(v.t.balance * lptUsd, { compact: true })} ·{" "}
                    </>
                  )}
                  {formatPercent(v.share * 100, { decimals: 0 })} of the{" "}
                  {ceiling} ceiling
                  {/* What open votes would take out, while there are any. */}
                  {record && record.upForVote > 0 && (
                    <span className="text-foreground">
                      {" "}
                      · {formatLPT(record.upForVote, { compact: true })} up for
                      vote
                    </span>
                  )}
                </>
              ) : (
                <InlineSkeleton className="w-56" />
              )}
            </span>
          </div>
          <FillMeter
            balance={v?.t.balance ?? 0}
            ceiling={v?.t.ceiling ?? 0}
            share={v?.share ?? 0}
          />
        </div>

        {/* Where it's heading, in a grid whose last row lines up with the
            chart's baseline beside it. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Fact label="Status">
            {v ? (
              <span className="flex items-center gap-1.5">
                <StatusDot tone={v.status.tone} />
                {v.status.label}
              </span>
            ) : (
              <InlineSkeleton className="w-16" />
            )}
          </Fact>
          <Fact label="Reward cut">
            {v ? v.cutPct : <InlineSkeleton className="w-10" />}
          </Fact>
          <Fact label="Pace">
            {!v ? (
              <InlineSkeleton className="w-28" />
            ) : v.pace.perRound > 0 && !v.pace.full ? (
              <>
                +{formatToken(v.pace.perRound, { compact: true })}
                <span className="text-muted-foreground"> LPT a round</span>
              </>
            ) : (
              <span className="text-muted-foreground">Not filling</span>
            )}
          </Fact>
          <Fact label={v?.pace.full ? "Ceiling" : "Full by"}>
            {!v ? (
              <InlineSkeleton className="w-16" />
            ) : v.pace.full ? (
              "Reached"
            ) : (
              v.fullBy.replace(/^~/, "")
            )}
          </Fact>
          {/* Its record: what passed proposals have taken out, and how
              often proposals pass. */}
          <Fact label="Paid out">
            {record ? (
              <Lpt value={record.paidOut} compact />
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Fact>
          <Fact label="Approval rate">
            {record && record.decided > 0 ? (
              <>
                {formatPercent((record.passed / record.decided) * 100, {
                  decimals: 0,
                })}
                <span className="text-muted-foreground">
                  {" "}
                  · {record.passed} of {record.decided}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </Fact>
        </dl>
      </div>

      <div className="lg:pl-6">
        {v ? (
          <TimeSeriesChart
            data={v.t.history}
            projection={
              "fullAt" in v.pace && v.pace.fullAt
                ? [{ ts: v.pace.fullAt, value: v.t.ceiling }]
                : undefined
            }
            // The label on the left, clear of the projection meeting the
            // ceiling on the right.
            reference={{
              value: v.t.ceiling,
              label: `Ceiling ${ceiling}`,
              side: "left",
            }}
            // Thirds of the ceiling, which is the top of the chart (or the
            // highest balance, if one ran a little over before the cut
            // stopped).
            yTicks={[0, 1 / 3, 2 / 3, 1].map((f) => f * v.t.ceiling)}
            domain={[
              0,
              Math.max(v.t.ceiling, ...v.t.history.map((h) => h.value)),
            ]}
            // As tall as the numbers beside it, so they meet its top and
            // baseline without a gap opening between them.
            height={CHART_HEIGHT}
            format={(n) => formatLPT(n)}
            axisFormat={(n) => formatToken(n, { compact: true })}
            ariaLabel={`Treasury balance since October 2023, now ${formatLPT(
              v.t.balance
            )} of a ${formatLPT(v.t.ceiling)} ceiling`}
          />
        ) : (
          <div style={{ height: CHART_HEIGHT }}>
            <Skeleton className="h-full" />
          </div>
        )}
      </div>

      {/* The rule, in view: it explains the chart's flat runs and drops.
          Its words don't wait for the figures in it. */}
      <div className="lg:col-span-2 lg:mt-5 lg:border-t lg:border-hairline lg:pt-4">
        <p className="text-ui-caption text-pretty text-muted-foreground">
          Each round, {v ? v.cutPct : <InlineSkeleton className="w-6" />} of the
          rewards orchestrators mint is paid into the treasury until it holds{" "}
          {ceiling ?? <InlineSkeleton className="w-14" />}. Then the cut
          switches off and it stops filling until governance sets a cut again.
          Funded proposals spend from it, so it falls as well as rises. The
          dashed line assumes every orchestrator calls reward and nothing is
          spent meanwhile.
        </p>
      </div>
    </Card>
  );
}

/**
 * The treasury in one line, for the Network page: balance against the
 * ceiling, whether it's filling, and when it's full. The whole strip links to
 * the full view on Governance.
 */
export function TreasuryStrip() {
  const { treasury, view: v } = useTreasuryView();
  if (treasury.error) return null;
  // Label over value, like the tiles above it, with the bar between. While
  // loading, the same strip with gaps for its figures, so it keeps its size.
  return (
    <Link
      href="/governance"
      className="surface group flex flex-col gap-3 px-4 py-4 transition-colors outline-none hover:bg-hover/60 focus-visible:ring-1 focus-visible:ring-green-bright/40 sm:flex-row sm:items-end sm:gap-6 sm:px-5"
    >
      <div className="flex shrink-0 flex-col gap-1.5">
        <span className="text-ui-caption text-muted-foreground">Treasury</span>
        <span className="text-ui-body tabular-nums">
          {v ? (
            <>
              {formatToken(v.t.balance, { compact: true })}
              <span className="text-muted-foreground">
                {" "}
                of {formatLPT(v.t.ceiling, { compact: true })}
              </span>
            </>
          ) : (
            <InlineSkeleton className="h-3.5 w-28" />
          )}
        </span>
      </div>
      {/* On the value line, level with the figures either side. */}
      <FillMeter
        balance={v?.t.balance ?? 0}
        ceiling={v?.t.ceiling ?? 0}
        share={v?.share ?? 0}
        pill
        className="sm:mb-[7px] sm:flex-1"
      />
      {/* Two figures, each with its own label, then the way to the full view. */}
      <div className="flex shrink-0 items-end gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-ui-caption text-muted-foreground">Status</span>
          {v ? (
            <span className="flex items-center gap-1.5 text-ui-body">
              <StatusDot tone={v.status.tone} />
              {v.status.label}
            </span>
          ) : (
            <span className="text-ui-body">
              <InlineSkeleton className="h-3.5 w-16" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-ui-caption text-muted-foreground">
            {v?.pace.full ? "Ceiling" : "Full by"}
          </span>
          <span className="text-ui-body tabular-nums">
            {!v ? (
              <InlineSkeleton className="h-3.5 w-16" />
            ) : v.pace.full ? (
              "Reached"
            ) : (
              v.fullBy.replace(/^~/, "")
            )}
          </span>
        </div>
        <ArrowRight className="mb-[3px] size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
