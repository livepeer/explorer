import type { SeriesPoint } from "./compute";

export const PERIODS = [
  { value: "1w", label: "1W", days: 7 },
  { value: "1m", label: "1M", days: 30 },
  { value: "3m", label: "3M", days: 90 },
  { value: "1y", label: "1Y", days: 365 },
  { value: "all", label: "All", days: null },
] as const;

export type Period = (typeof PERIODS)[number]["value"];

export const periodDays = (p: Period) =>
  PERIODS.find((x) => x.value === p)?.days ?? null;

export function periodLabel(p: Period) {
  return {
    "1w": "past week",
    "1m": "past 30 days",
    "3m": "past 3 months",
    "1y": "past year",
    all: "all time",
  }[p];
}

export function sliceSeries(
  series: SeriesPoint[],
  period: Period,
  nowSec: number
) {
  const days = periodDays(period);
  if (days == null) return series;
  const since = nowSec - days * 86400;
  return series.filter((p) => p.ts >= since);
}

/**
 * Bucket per-round flows (rewards, fees) into calendar weeks once a range is
 * long enough that one bar per round would be thinner than a hairline.
 */
export function bucketFlows(
  series: SeriesPoint[],
  key: "rewards" | "fees",
  maxBars = 60
): { ts: number; value: number; round?: number }[] {
  if (series.length <= maxBars) {
    return series.map((p) => ({ ts: p.ts, value: p[key], round: p.round }));
  }
  const WEEK = 7 * 86400;
  const out: { ts: number; value: number }[] = [];
  let start = series[0].ts;
  let sum = 0;
  for (const p of series) {
    if (p.ts - start >= WEEK) {
      out.push({ ts: start, value: sum });
      start = p.ts;
      sum = 0;
    }
    sum += p[key];
  }
  out.push({ ts: start, value: sum });
  return out;
}

/** Downsample a level series (stake, share) to at most `max` points. */
export function thin<T>(points: T[], max = 240): T[] {
  if (points.length <= max) return points;
  const step = points.length / max;
  const out: T[] = [];
  for (let i = 0; i < max; i++) out.push(points[Math.floor(i * step)]);
  out.push(points[points.length - 1]);
  return out;
}
