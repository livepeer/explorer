"use client";

import { useMemo, useState } from "react";

import { TimeSeriesChart } from "@/components/charts/time-series";
import { Card } from "@/components/page";
import { Segmented, Skeleton, StatusDot } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import {
  formatETH,
  formatLPT,
  formatNumber,
  formatPercent,
  formatToken,
  formatUSD,
} from "@/lib/format";
import type { SeriesPoint } from "@/lib/portfolio/compute";
import { sumSince } from "@/lib/portfolio/compute";
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
  perRound,
  nowSec,
  loading,
  actions,
}: {
  series: SeriesPoint[];
  stake: number;
  lptPrice?: number;
  perRound: number;
  nowSec: number;
  loading?: boolean;
  /** Beside the time range, e.g. an export. */
  actions?: React.ReactNode;
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
  const startStake = sliced[0]?.stake ?? 0;
  const earnedPct = startStake > 0 ? (earned / startStake) * 100 : null;

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
          label: "Total stake over time",
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

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="text-ui-caption text-muted-foreground">
            Total stake
          </div>
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-ui-body">
            {lptPrice != null && !loading && (
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
          {!loading && perRound > 0 && (
            <Tooltip content="Your average reward per round over the last 30 rounds. It arrives each round your orchestrator calls reward.">
              <div className="mt-1 flex w-fit cursor-default items-center gap-2 text-ui-caption text-muted-foreground">
                <StatusDot pulse />
                About
                <span className="font-mono text-foreground tabular-nums">
                  +{formatNumber(perRound, { decimals: 2 })} LPT
                </span>
                per round at the current rate
              </div>
            </Tooltip>
          )}
        </div>

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

      <div className="px-2 pb-3 sm:px-4">
        {loading ? (
          <Skeleton className="mx-2 h-[260px]" />
        ) : chart.data.length < 2 ? (
          <div className="flex h-[260px] items-center justify-center text-ui-body text-muted-foreground">
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
            height={260}
            tooltipTitle={
              bucketed
                ? (p) =>
                    `Week of ${new Date(p.ts * 1000).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}`
                : undefined
            }
          />
        )}
      </div>

      {metric === "fees" && !loading && (
        <div className="border-t border-hairline px-5 py-3 text-ui-caption text-muted-foreground sm:px-6">
          {formatETH(earnedFees)} in fees {periodLabel(period)}
        </div>
      )}
    </Card>
  );
}
