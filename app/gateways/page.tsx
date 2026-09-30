"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import {
  formatLastDay,
  formatRunway,
  GATEWAY_HINT,
  GatewayName,
  RUNWAY_HINT,
  WeeklyTrend,
} from "@/components/gateways/shared";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Kpi,
  KpiStrip,
  Page,
  PageHeader,
} from "@/components/page";
import { Input, Skeleton } from "@/components/ui/misc";
import { SortHeader } from "@/components/ui/sort-header";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { formatETH } from "@/lib/format";
import { useGateways } from "@/lib/hooks/queries";
import { depositRunway, type Gateway } from "@/lib/subgraph/gateways";

type SortKey = "fees90" | "fees30" | "deposit" | "reserve" | "total" | "last";

const SORTS: Record<SortKey, (g: Gateway) => number> = {
  fees90: (g) => g.ninetyDayVolumeETH,
  fees30: (g) => g.thirtyDayVolumeETH,
  deposit: (g) => g.deposit,
  reserve: (g) => g.reserve,
  total: (g) => g.totalVolumeETH,
  last: (g) => g.lastActiveDay,
};

function Runway({ g }: { g: Gateway }) {
  const days = depositRunway(g);
  if (days == null) return null;
  return (
    <div
      className={cn(
        "font-mono text-[11px] tabular-nums",
        days < 14 ? "text-warm" : "text-subtle-foreground"
      )}
    >
      {formatRunway(days)}
    </div>
  );
}

function GatewayKpis({ data }: { data?: Gateway[] }) {
  const stats = useMemo(() => {
    if (!data) return null;
    const paying = data.filter((g) => g.ninetyDayVolumeETH > 0);
    const fees90 = paying.reduce((s, g) => s + g.ninetyDayVolumeETH, 0);
    const top3 = [...paying]
      .sort((a, b) => b.ninetyDayVolumeETH - a.ninetyDayVolumeETH)
      .slice(0, 3)
      .reduce((s, g) => s + g.ninetyDayVolumeETH, 0);
    return {
      paying: paying.length,
      listed: data.length,
      fees30: data.reduce((s, g) => s + g.thirtyDayVolumeETH, 0),
      fees90,
      deposits: data.reduce((s, g) => s + g.deposit, 0),
      reserves: data.reduce((s, g) => s + g.reserve, 0),
      top3Share: fees90 > 0 ? top3 / fees90 : 0,
    };
  }, [data]);
  const loading = <Skeleton className="h-6 w-20" />;
  return (
    <KpiStrip className="mb-8">
      <Kpi
        label="Paying gateways"
        value={stats ? stats.paying : loading}
        sub={stats ? "Paid fees in the last 90 days" : undefined}
      />
      <Kpi
        label="Fees · 30 days"
        value={stats ? formatETH(stats.fees30) : loading}
        sub={stats ? `${formatETH(stats.fees90)} over 90 days` : undefined}
      />
      <Kpi
        label="Held in deposits"
        value={stats ? formatETH(stats.deposits) : loading}
        sub={stats ? `+ ${formatETH(stats.reserves)} in reserves` : undefined}
      />
      <Kpi
        label={
          <Tooltip content="How much of the last 90 days' fees came from the three largest gateways. The higher it is, the more orchestrator fees depend on a few gateways.">
            <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
              Top 3 share
            </span>
          </Tooltip>
        }
        value={stats ? `${(stats.top3Share * 100).toFixed(0)}%` : loading}
        sub={stats ? "Of 90-day fees" : undefined}
      />
    </KpiStrip>
  );
}

export default function GatewaysPage() {
  const { data, error, isLoading, refetch } = useGateways();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("fees90");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const ranked = [...data]
      .sort((a, b) => b.ninetyDayVolumeETH - a.ninetyDayVolumeETH)
      .map((g, i) => ({ g, rank: i + 1 }));
    return ranked
      .filter(({ g }) => !q || g.id.includes(q))
      .sort((a, b) => {
        const d = SORTS[sort](a.g) - SORTS[sort](b.g);
        return dir === "desc" ? -d : d;
      });
  }, [data, query, sort, dir]);

  const onSort = (k: SortKey) => {
    if (k === sort) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(k);
      setDir("desc");
    }
  };

  const header = { sort, dir, onSort };

  return (
    <Page>
      <PageHeader
        title="Gateways"
        description={
          <>
            Gateways send jobs to orchestrators and pay for them in ETH:
            they&apos;re where the network&apos;s fees come from.{" "}
            <Tooltip content={GATEWAY_HINT}>
              <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
                How it works
              </span>
            </Tooltip>
          </>
        }
      />

      <GatewayKpis data={data} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by address"
            aria-label="Filter gateways by address"
            className="pl-8"
          />
        </div>
        <p className="text-ui-caption text-muted-foreground">
          Gateways with fees in the last 90 days or started in the last year
        </p>
      </div>

      {error ? (
        <ErrorNotice error={error} onRetry={() => refetch()} />
      ) : (
        <>
          {/* Phones: condensed cards. */}
          <Card className="divide-y divide-(--hairline) md:hidden">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              ))}
            {rows.map(({ g, rank }) => (
              <div key={g.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <GatewayName id={g.id} rank={rank} />
                  <WeeklyTrend days={g.days} />
                </div>
                <dl className="grid grid-cols-3 gap-3 pl-9">
                  {[
                    ["Fees · 90d", formatETH(g.ninetyDayVolumeETH)],
                    ["Deposit", formatETH(g.deposit)],
                    ["Last paid", formatLastDay(g.lastActiveDay)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex min-w-0 flex-col gap-0.5">
                      <dt className="text-[11px] text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="truncate font-mono text-[12.5px] tabular-nums">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            {!isLoading && rows.length === 0 && (
              <EmptyState title="No gateways match" />
            )}
          </Card>

          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] text-left text-ui-body">
              <thead>
                <tr className="border-b border-hairline text-ui-caption">
                  <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 pl-4 font-normal text-muted-foreground">
                    Gateway
                  </th>
                  <SortHeader
                    label="Fees · 90d"
                    k="fees90"
                    {...header}
                    hint="ETH paid to orchestrators over the last 90 days. The line shows it week by week."
                  />
                  <SortHeader label="Fees · 30d" k="fees30" {...header} />
                  <SortHeader
                    label="Deposit"
                    k="deposit"
                    {...header}
                    hint={`Funds that pay for winning tickets. ${RUNWAY_HINT}`}
                  />
                  <SortHeader
                    label="Reserve"
                    k="reserve"
                    {...header}
                    hint="Backs the gateway's tickets if its deposit runs out, so orchestrators still get paid."
                  />
                  <SortHeader label="All-time fees" k="total" {...header} />
                  <SortHeader
                    label="Last paid"
                    k="last"
                    {...header}
                    className="pr-4"
                  />
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-hairline last:border-0"
                    >
                      <td className="px-4 py-3.5" colSpan={7}>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-7 rounded-full" />
                          <Skeleton className="h-3.5 w-40" />
                          <Skeleton className="ml-auto h-3.5 w-1/2" />
                        </div>
                      </td>
                    </tr>
                  ))}
                {rows.map(({ g, rank }) => {
                  const idle = g.ninetyDayVolumeETH <= 0;
                  return (
                    <tr
                      key={g.id}
                      className="group border-b border-hairline transition-colors last:border-0 hover:bg-hover/60"
                    >
                      <td className="sticky left-0 z-10 bg-surface px-3 py-3 pl-1 group-hover:bg-[color-mix(in_oklch,var(--surface),var(--foreground)_2.5%)]">
                        <GatewayName id={g.id} rank={rank} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!idle && <WeeklyTrend days={g.days} />}
                          <span className="font-mono text-[13px] whitespace-nowrap tabular-nums">
                            {idle ? "—" : formatETH(g.ninetyDayVolumeETH)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
                        {g.thirtyDayVolumeETH > 0
                          ? formatETH(g.thirtyDayVolumeETH)
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-mono text-[13px] whitespace-nowrap tabular-nums">
                          {formatETH(g.deposit)}
                        </div>
                        <Runway g={g} />
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap tabular-nums">
                        {formatETH(g.reserve)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
                        {formatETH(g.totalVolumeETH)}
                      </td>
                      <td className="px-3 py-3 pr-4 text-right text-[13px] whitespace-nowrap text-muted-foreground">
                        {formatLastDay(g.lastActiveDay)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!isLoading && rows.length === 0 && (
              <EmptyState
                title="No gateways match"
                description="Try a different address."
              />
            )}
          </Card>
        </>
      )}
    </Page>
  );
}
