"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ActivityList } from "@/components/activity-list";
import {
  type Point,
  Sparkline,
  TimeSeriesChart,
} from "@/components/charts/time-series";
import { LiveStatus } from "@/components/live-status";
import {
  Card,
  ErrorNotice,
  Kpi,
  KpiStrip,
  Page,
  PageHeader,
  Section,
  SectionHeader,
} from "@/components/page";
import { Ring, roundState, useNow } from "@/components/shell/round-clock";
import { Segmented, Skeleton, StatusDot } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import {
  formatDate,
  formatDuration,
  formatETH,
  formatLPT,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { useLiveFeed } from "@/lib/hooks/live-feed";
import {
  useDays,
  useEvents,
  useProtocol,
  useRewardProgress,
} from "@/lib/hooks/queries";
import type { Day, Protocol } from "@/lib/subgraph/network";

/* ── Round ───────────────────────────────────────────────────────────────── */

function RoundCard({ protocol }: { protocol: Protocol }) {
  const now = useNow(1000);
  const s = roundState(protocol, now);
  const next = protocol.currentRound + 1;
  const endsAt = new Date(s.endsAt).toLocaleString("en-US", {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-1 items-center gap-5 p-5 sm:p-6">
        <Ring
          progress={s.progress}
          size={112}
          stroke={9}
          tone={s.overdue || !s.initialized ? "warning" : "positive"}
        >
          <span className="text-[22px] leading-7 font-medium tracking-[-0.01em]">
            {Math.floor(s.progress * 100)}%
          </span>
          <span className="text-[11px] text-muted-foreground">elapsed</span>
        </Ring>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="text-ui-caption text-muted-foreground">
            Current round
          </div>
          <div className="text-[22px] leading-7 font-medium tracking-[-0.01em]">
            {protocol.currentRound.toLocaleString()}
          </div>
          <div className="font-mono text-ui-body text-foreground tabular-nums">
            {s.overdue
              ? "Ready to initialize"
              : `${formatDuration(s.remaining)} left`}
          </div>
          <div className="text-ui-caption text-muted-foreground">
            {s.overdue
              ? `Round ${next.toLocaleString()} can be initialized now`
              : `Round ${next.toLocaleString()} begins around ${endsAt}`}
          </div>
          <div className="text-ui-caption text-muted-foreground">
            <span className="font-mono tabular-nums">
              ~{s.blocksElapsed.toLocaleString()} /{" "}
              {protocol.roundLength.toLocaleString()}
            </span>{" "}
            L1 blocks
          </div>
          <div className="mt-1 flex items-center gap-2 text-ui-caption text-muted-foreground">
            <StatusDot tone={s.initialized ? "positive" : "warning"} />
            {s.initialized ? "Initialized" : "Awaiting initialization"}
          </div>
        </div>
      </div>
      <RewardCalls round={protocol.currentRound} />
    </Card>
  );
}

function RoundCardSkeleton() {
  return (
    <Card className="flex h-full flex-col">
      <div className="flex flex-1 items-center gap-5 p-5 sm:p-6">
        <Skeleton className="size-28 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="border-t border-hairline px-5 py-3.5 sm:px-6">
        <Skeleton className="h-3.5 w-full" />
      </div>
    </Card>
  );
}

/* ── KPIs ────────────────────────────────────────────────────────────────── */

/** +1.20 / −0.35: a real minus sign, and a plus for gains. */
const signed = (v: number, decimals: number) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(decimals)}`;

const shortDate = (ts: number) =>
  new Date(ts * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

const TREND_HEIGHT = 28;

/**
 * A KPI's last 30 days: the sparkline, what span it covers and how much it
 * moved, since each line is scaled to its own range and small moves look
 * big. Move along the line to read any day: a dot follows, and the
 * caption shows that day's date and value. Fees are daily amounts, so they
 * show no change figure.
 */
function KpiTrend({
  days,
  pick,
  format,
  change,
  fees,
}: {
  days: Day[];
  pick: (d: Day) => number;
  format: (v: number) => string;
  change?: (first: number, last: number) => string;
  fees?: boolean;
}) {
  const [at, setAt] = useState<number | null>(null);
  if (days.length < 2) return null;
  const values = days.map(pick);
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const last = values.length - 1;
  // Same geometry as Sparkline: 1px inset, y inverted.
  const top = (v: number) =>
    TREND_HEIGHT - 1 - ((v - min) / span) * (TREND_HEIGHT - 2);

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    setAt(Math.round(f * last));
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="relative cursor-crosshair touch-pan-y"
        onPointerMove={scrub}
        onPointerDown={scrub}
        onPointerLeave={() => setAt(null)}
        role="img"
        aria-label={`${shortDate(days[0].date)} to ${shortDate(
          days[last].date
        )}: ${format(values[0])} to ${format(values[last])}`}
      >
        <Sparkline
          values={values}
          height={TREND_HEIGHT}
          color="var(--subtle-foreground)"
          fluid
        />
        {at != null && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-px bg-hairline"
              style={{ left: `${(at / last) * 100}%` }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${(at / last) * 100}%`, top: top(values[at]) }}
            />
          </>
        )}
      </div>
      <div className="flex justify-between font-mono text-[10px] text-subtle-foreground tabular-nums">
        {at != null ? (
          <>
            <span>{shortDate(days[at].date)}</span>
            <span className="text-foreground">{format(values[at])}</span>
          </>
        ) : (
          <>
            <span>{fees ? "Daily · 30 days" : "30 days"}</span>
            {change && <span>{change(values[0], values[last])}</span>}
          </>
        )}
      </div>
    </div>
  );
}

function NetworkKpis({ protocol }: { protocol?: Protocol }) {
  // Shares the history chart's cache: no extra request.
  const { data: days } = useDays(365);
  if (!protocol) {
    return (
      <KpiStrip cols={2} className="h-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-4 sm:px-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </KpiStrip>
    );
  }
  const recent = days?.slice(-30) ?? [];
  const fees30 = recent.reduce((s, d) => s + d.volumeETH, 0);

  return (
    <KpiStrip cols={2} className="h-full">
      <Kpi
        label="Participation"
        value={formatPercent(protocol.participationRate, { decimals: 2 })}
        // Participation is staked LPT over total supply, so show both.
        sub={`${formatNumber(protocol.totalActiveStake, {
          compact: true,
        })} of ${formatLPT(protocol.totalSupply, {
          compact: true,
        })} staked · target ${formatPercent(protocol.targetBondingRate, {
          decimals: 0,
        })}`}
        trend={
          <KpiTrend
            days={recent}
            pick={(d) => d.participationRate}
            format={(v) => formatPercent(v, { decimals: 2 })}
            change={(a, b) => `${signed(b - a, 2)} pts`}
          />
        }
      />
      <Kpi
        label="Inflation per round"
        value={formatPercent(protocol.inflation / 1e7, { decimals: 4 })}
        sub={
          // The minter nudges inflation toward the target bonding rate:
          // up while participation is below it, down while above.
          protocol.participationRate < protocol.targetBondingRate
            ? "Rising: participation is below target"
            : "Falling: participation is above target"
        }
        trend={
          <KpiTrend
            days={recent}
            pick={(d) => d.inflation}
            format={(v) => formatPercent(v, { decimals: 4 })}
            change={(a, b) =>
              a > 0 ? `${signed(((b - a) / a) * 100, 1)}%` : ""
            }
          />
        }
      />
      <Kpi
        label="Fees · 30 days"
        value={days ? formatETH(fees30) : <Skeleton className="h-6 w-28" />}
        sub={`${formatETH(protocol.totalVolumeETH)} all time`}
        trend={
          <KpiTrend
            days={recent}
            pick={(d) => d.volumeETH}
            format={formatETH}
            fees
          />
        }
      />
      <Kpi
        label="Delegators"
        value={protocol.delegatorsCount.toLocaleString()}
        sub={`${protocol.activeTranscoderCount.toLocaleString()} active orchestrators`}
        trend={
          <KpiTrend
            days={recent}
            pick={(d) => d.delegatorsCount}
            format={(v) => v.toLocaleString()}
            change={(a, b) =>
              a > 0 ? `${signed(((b - a) / a) * 100, 1)}%` : ""
            }
          />
        }
      />
    </KpiStrip>
  );
}

/* ── History charts ──────────────────────────────────────────────────────── */

type Metric = "participation" | "fees" | "inflation" | "delegators";
type Range = "3m" | "1y";

const METRICS = [
  { value: "participation", label: "Participation" },
  { value: "fees", label: "Fee volume" },
  { value: "inflation", label: "Inflation" },
  { value: "delegators", label: "Delegators" },
] as const;

const RANGES = [
  { value: "3m", label: "3M" },
  { value: "1y", label: "1Y" },
] as const;

/** Sum daily values into 7-day buckets, anchored on the latest day. A partial
 * leading week is dropped so it doesn't read as a dip. */
function weekly(points: Point[]): Point[] {
  const out: Point[] = [];
  for (let end = points.length; end >= 7; end -= 7) {
    const slice = points.slice(end - 7, end);
    out.push({
      ts: slice[0].ts,
      value: slice.reduce((a, p) => a + p.value, 0),
    });
  }
  return out.reverse();
}

function useChart(days: Day[] | undefined, metric: Metric, range: Range) {
  return useMemo(() => {
    const all = days ?? [];
    const latest = all.length ? all[all.length - 1].date : 0;
    const cutoff = latest - (range === "3m" ? 90 : 365) * 86400;
    const sliced = all.filter((d) => d.date > cutoff);
    const pts = (pick: (d: Day) => number) =>
      sliced.map((d) => ({ ts: d.date, value: pick(d) }));

    switch (metric) {
      case "participation":
        return {
          data: pts((d) => d.participationRate),
          kind: "area" as const,
          color: "var(--series-1)",
          format: (v: number) => formatPercent(v, { decimals: 2 }),
          axis: (v: number) => formatPercent(v, { decimals: 0 }),
          label: "Share of LPT supply staked, daily",
          bucketed: false,
        };
      case "fees": {
        const daily = pts((d) => d.volumeETH);
        const bucketed = daily.length > 90;
        return {
          data: bucketed ? weekly(daily) : daily,
          kind: "bar" as const,
          color: "var(--series-4)",
          format: formatETH,
          axis: (v: number) => formatNumber(v, { decimals: v < 1 ? 2 : 0 }),
          label: bucketed
            ? "ETH fee volume per week"
            : "ETH fee volume per day",
          bucketed,
        };
      }
      case "inflation":
        return {
          data: pts((d) => d.inflation),
          kind: "area" as const,
          color: "var(--series-1)",
          format: (v: number) => formatPercent(v, { decimals: 4 }),
          axis: (v: number) => formatPercent(v, { decimals: 3 }),
          label: "Inflation per round, daily",
          bucketed: false,
        };
      case "delegators":
        return {
          data: pts((d) => d.delegatorsCount),
          kind: "area" as const,
          color: "var(--series-1)",
          format: (v: number) => Math.round(v).toLocaleString(),
          axis: (v: number) => formatNumber(v, { decimals: 0, compact: true }),
          label: "Delegators with stake, daily",
          bucketed: false,
        };
    }
  }, [days, metric, range]);
}

function HistorySection() {
  const [metric, setMetric] = useState<Metric>("participation");
  const [range, setRange] = useState<Range>("1y");
  const { data: days, isLoading, error, refetch } = useDays(365);
  const chart = useChart(days, metric, range);

  return (
    <Section>
      <SectionHeader
        title="History"
        description={chart.label}
        action={
          <Segmented
            label="Time range"
            size="xs"
            value={range}
            onChange={setRange}
            options={RANGES}
          />
        }
      />
      {error ? (
        <ErrorNotice error={error} onRetry={() => refetch()} />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto px-4 pt-4 sm:px-5">
            <Segmented
              label="Chart metric"
              value={metric}
              onChange={setMetric}
              options={METRICS}
            />
          </div>
          <div className="px-2 pt-4 pb-3 sm:px-4">
            {isLoading ? (
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
                domain={metric === "fees" ? [0, "auto"] : ["auto", "auto"]}
                tooltipTitle={
                  chart.bucketed
                    ? (p) =>
                        `Week of ${formatDate(p.ts, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}`
                    : undefined
                }
              />
            )}
          </div>
        </Card>
      )}
    </Section>
  );
}

/* ── Reward calls this round ─────────────────────────────────────────────── */

/**
 * How many active orchestrators have called reward in the current round.
 * It fills through every round and resets at the next, so the page always
 * shows the protocol moving; a laggard late in a round is worth knowing.
 */
/** Footer of the round card: who has called reward so far this round. */
function FooterStat({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 border-hairline px-4 py-3.5 sm:px-5",
        className
      )}
    >
      <span className="truncate text-ui-caption text-muted-foreground">
        {label}
      </span>
      <div className="font-mono text-[13px] leading-5 whitespace-nowrap tabular-nums">
        {children}
      </div>
    </div>
  );
}

/**
 * Footer of the round card: this round's reward calls and what it has paid
 * out so far. Three columns when the card is wide; on a narrow card the
 * reward calls take a full row so the bar keeps a useful length.
 */
function RewardCalls({ round }: { round: number }) {
  const { data } = useRewardProgress(round);
  const pct = data && data.total > 0 ? (data.called / data.total) * 100 : 0;
  const loading = <Skeleton className="h-3.5 w-14" />;
  return (
    <div className="@container border-t border-hairline">
      <div className="grid grid-cols-2 @min-[26rem]:grid-cols-3">
        <FooterStat
          label="Reward calls"
          className="col-span-2 @min-[26rem]:col-span-1"
        >
          {data ? (
            <span className="flex items-center gap-2.5">
              <span>
                {data.called}
                <span className="text-muted-foreground">/{data.total}</span>
              </span>
              <span
                role="progressbar"
                aria-label="Orchestrators that have called reward this round"
                aria-valuenow={Math.round(pct)}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]"
              >
                <span
                  className="block h-full rounded-full bg-green-bright transition-[width] duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </span>
            </span>
          ) : (
            loading
          )}
        </FooterStat>
        <FooterStat
          label="Minted this round"
          className="border-t @min-[26rem]:border-t-0 @min-[26rem]:border-l"
        >
          {data ? formatLPT(data.minted, { compact: true }) : loading}
        </FooterStat>
        <FooterStat
          label="Fees this round"
          className="border-t border-l @min-[26rem]:border-t-0"
        >
          {data ? formatETH(data.fees) : loading}
        </FooterStat>
      </div>
    </div>
  );
}

/* ── Latest activity ─────────────────────────────────────────────────────── */

function LatestActivity() {
  const { data, isLoading, error, dataUpdatedAt } = useEvents(200);
  const latest = useMemo(() => data?.slice(0, 8), [data]);
  // The feed sits below the fold, so never hold arrivals back for scrolling.
  const { shown, fresh } = useLiveFeed(latest, { holdBelow: Infinity });
  return (
    <Section>
      <SectionHeader
        title="Latest activity"
        description="Fees earned, delegations, reward calls and votes, as they're indexed"
        action={
          <>
            <LiveStatus updatedAt={dataUpdatedAt} failing={Boolean(error)} />
            <Link
              href="/activity"
              className="ml-2 inline-flex items-center gap-1 text-ui-caption text-muted-foreground hover:text-foreground"
            >
              View all <ArrowRight className="size-3" />
            </Link>
          </>
        }
      />
      <ActivityList
        events={shown}
        loading={isLoading || !shown}
        fresh={fresh}
      />
    </Section>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function NetworkPage() {
  const { data: protocol, error, refetch } = useProtocol();

  return (
    <Page>
      <PageHeader
        title="Network"
        description="Round progress, stake participation, inflation and fee volume across the Livepeer protocol."
      />

      {error && !protocol ? (
        <ErrorNotice error={error} onRetry={() => refetch()} />
      ) : (
        <Section>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {protocol ? (
              <RoundCard protocol={protocol} />
            ) : (
              <RoundCardSkeleton />
            )}
            <NetworkKpis protocol={protocol} />
          </div>
        </Section>
      )}

      <HistorySection />

      <LatestActivity />
    </Page>
  );
}
