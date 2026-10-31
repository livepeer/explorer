"use client";

import { useMemo, useState } from "react";

import { TimeSeriesChart } from "@/components/charts/time-series";
import { Card } from "@/components/page";
import { Segmented, Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import {
  formatETH,
  formatLPT,
  formatNumber,
  formatPercent,
  formatToken,
  formatUSD,
} from "@/lib/format";
import type { SeriesPoint } from "@/lib/portfolio/compute";
import { averageStakeSince, sumSince } from "@/lib/portfolio/compute";
import {
  bucketFlows,
  type Period,
  periodDays,
  periodLabel,
  PERIODS,
  sliceSeries,
  thin,
} from "@/lib/portfolio/view";

type Metric = "stake" | "rewards" | "fees" | "share";

const METRICS = [
  { value: "stake", label: "Stake" },
  { value: "rewards", label: "Rewards" },
  { value: "fees", label: "Fees" },
  { value: "share", label: "Network share" },
] as const;

const axisLpt = (v: number) =>
  formatNumber(v, { decimals: v < 10 ? 1 : 0, compact: true });

export function PortfolioHero({
  series,
  stake,
  lptPrice,
  nowSec,
  loading,
  actions,
  label,
  position,
  positionActions,
  variant = "card",
}: {
  series: SeriesPoint[];
  stake: number;
  lptPrice?: number;
  nowSec: number;
  loading?: boolean;
  /** Beside the time range, e.g. an export. */
  actions?: React.ReactNode;
  /** Over the balance in place of "Total delegated": who it's delegated to. */
  label?: React.ReactNode;
  /** Under the balance on a single wallet's page: what it earns. */
  position?: React.ReactNode;
  /** Beside the balance on a single wallet's page: Delegate, Undelegate. */
  positionActions?: React.ReactNode;
  /**
   * "page": the balance as the page's headline, on the page itself, with the
   * chart's controls on one line above the chart in its own card (a single
   * wallet's page, brokerage-style). "card": all of it in one card.
   */
  variant?: "card" | "page";
}) {
  const [period, setPeriod] = useState<Period>("3m");
  const [metric, setMetric] = useState<Metric>("stake");

  const sliced = useMemo(
    () => sliceSeries(series, period, nowSec),
    [series, period, nowSec]
  );
  const days = periodDays(period);
  const since = days == null ? 0 : nowSec - days * 86400;
  const earned = sumSince(series, "rewards", since);
  const earnedFees = sumSince(series, "fees", since);
  // Earned as a share of the stake it was earned on (the period's average),
  // so stake added or removed along the way doesn't skew it.
  const avgStake = averageStakeSince(series, since);
  const earnedPct = avgStake > 0 ? (earned / avgStake) * 100 : null;

  const chart = useMemo(() => {
    switch (metric) {
      case "stake":
        return {
          kind: "area" as const,
          color: "var(--series-1)",
          data: thin(
            sliced.map((p) => ({ ts: p.ts, value: p.stake, round: p.round }))
          ),
          format: (v: number) => formatLPT(v),
          axis: axisLpt,
          label: "Delegated stake over time",
        };
      case "rewards":
        return {
          kind: "bar" as const,
          color: "var(--series-3)",
          data: bucketFlows(sliced, "rewards"),
          format: (v: number) => `+${formatLPT(v)}`,
          axis: axisLpt,
          label: "LPT rewards earned per round",
        };
      case "fees":
        return {
          kind: "bar" as const,
          color: "var(--series-4)",
          data: bucketFlows(sliced, "fees"),
          format: (v: number) => `+${formatETH(v)}`,
          axis: (v: number) => formatNumber(v, { decimals: v < 0.1 ? 3 : 2 }),
          label: "ETH fees earned per round",
        };
      case "share":
        return {
          kind: "area" as const,
          color: "var(--series-7)",
          data: thin(
            sliced
              .filter((p) => p.share != null)
              .map((p) => ({
                ts: p.ts,
                value: p.share as number,
                round: p.round,
              }))
          ),
          format: (v: number) => `${v.toFixed(4)}%`,
          axis: (v: number) => `${v.toFixed(v < 0.1 ? 3 : 2)}%`,
          label: "Share of network stake over time",
        };
    }
  }, [metric, sliced]);

  const bucketed =
    (metric === "rewards" || metric === "fees") &&
    chart.data.length < sliced.length;

  const numberEl = (
    <div className="flex min-w-0 flex-col gap-2">
      {label ?? (
        <div className="text-ui-caption text-muted-foreground">
          Total delegated
        </div>
      )}
      {loading ? (
        <Skeleton className="h-12 w-72" />
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-display-md font-light tracking-[-0.02em]">
            {formatToken(stake)}
          </span>
          <span className="text-[20px] font-light text-muted-foreground">
            LPT
          </span>
        </div>
      )}
      {/* Nothing staked: no line of zeros, nor dust left from before. */}
      {(loading || stake > 0 || earned >= 0.01) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ui-body">
          {lptPrice != null && !loading && stake * lptPrice >= 0.005 && (
            <span className="text-muted-foreground">
              {formatUSD(stake * lptPrice)}
            </span>
          )}
          {!loading && (
            <span className="text-green-bright">
              +{formatToken(earned)} LPT
              {earnedPct != null && period !== "all" && (
                <span className="text-green-bright/80">
                  {" "}
                  ({formatPercent(earnedPct, { decimals: 2 })})
                </span>
              )}
            </span>
          )}
          {!loading && (
            <span className="text-muted-foreground">
              earned {periodLabel(period)}
            </span>
          )}
        </div>
      )}
      {position}
    </div>
  );
  const chartEl = (
    <div className="px-2 pb-3 sm:px-4">
      {loading ? (
        <Skeleton
          className={cn("mx-2", variant === "page" ? "h-[240px]" : "h-[200px]")}
        />
      ) : chart.data.length < 2 ? (
        <div
          className={cn(
            "flex items-center justify-center text-ui-body text-muted-foreground",
            variant === "page" ? "h-[240px]" : "h-[200px]"
          )}
        >
          Not enough history in this range yet.
        </div>
      ) : (
        <TimeSeriesChart
          ariaLabel={chart.label}
          data={chart.data}
          kind={chart.kind}
          color={chart.color}
          format={chart.format}
          axisFormat={chart.axis}
          height={variant === "page" ? 240 : 200}
          tooltipTitle={
            bucketed
              ? (p) =>
                  `Week of ${new Date(p.ts * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`
              : undefined
          }
        />
      )}
    </div>
  );
  const feesEl = metric === "fees" && !loading && (
    <div className="border-t border-hairline px-5 py-3 text-ui-caption text-muted-foreground sm:px-6">
      {formatETH(earnedFees)} in fees {periodLabel(period)}
    </div>
  );

  if (variant === "page") {
    return (
      <div className="flex flex-col gap-5">
        {/* The balance and what you can do with it, side by side once
            there's room; narrower, the actions follow the balance. */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          {numberEl}
          {positionActions && <div className="shrink-0">{positionActions}</div>}
        </div>
        {/* What to chart and over how long, on one line above the chart. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Segmented
            label="Chart metric"
            value={metric}
            onChange={setMetric}
            options={METRICS}
          />
          <div className="flex items-center gap-1.5">
            {actions}
            <Segmented
              label="Time range"
              size="xs"
              value={period}
              onChange={setPeriod}
              options={PERIODS}
            />
          </div>
        </div>
        <Card className="overflow-hidden pt-4">
          {chartEl}
          {feesEl}
        </Card>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        {numberEl}
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <Segmented
            label="Chart metric"
            value={metric}
            onChange={setMetric}
            options={METRICS}
          />
          <div className="flex items-center gap-1.5">
            {actions}
            <Segmented
              label="Time range"
              size="xs"
              value={period}
              onChange={setPeriod}
              options={PERIODS}
            />
          </div>
        </div>
      </div>

      {chartEl}

      {feesEl}
    </Card>
  );
}
