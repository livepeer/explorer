"use client";

import { ArrowLeft, Server, TriangleAlert, User } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";
import { isAddress } from "viem";

import { ActivityList } from "@/components/activity-list";
import { TimeSeriesChart } from "@/components/charts/time-series";
import {
  formatLastDay,
  formatRunway,
  RUNWAY_HINT,
} from "@/components/gateways/shared";
import {
  Avatar,
  CopyButton,
  Identity,
  useIdentity,
} from "@/components/identity";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Kpi,
  KpiStrip,
  Page,
  SectionHeader,
} from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, StatusDot } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { addressUrl } from "@/lib/config";
import {
  formatDate,
  formatETH,
  formatNumber,
  formatRelativeTime,
  shortAddress,
} from "@/lib/format";
import {
  useGateway,
  useGatewayEvents,
  useGatewayPayouts,
  useOrchestrators,
} from "@/lib/hooks/queries";
import {
  dailyFees,
  depositRunway,
  type GatewayPayouts,
} from "@/lib/subgraph/gateways";

function Payouts({
  address,
  payouts,
}: {
  address: string;
  payouts: GatewayPayouts;
}) {
  const top = payouts.recipients.slice(0, 25);
  if (!top.length) {
    return (
      <Card>
        <EmptyState
          title="No payouts in the last 90 days"
          description="This gateway hasn't paid any winning tickets recently."
        />
      </Card>
    );
  }
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left">
        <thead>
          <tr className="border-b border-hairline text-ui-caption text-muted-foreground">
            <th className="px-4 py-2.5 font-normal">Orchestrator</th>
            <th className="px-4 py-2.5 font-normal">Share</th>
            <th className="px-4 py-2.5 text-right font-normal">Fees</th>
            <th className="px-4 py-2.5 text-right font-normal">Tickets</th>
            <th className="px-4 py-2.5 text-right font-normal">Last paid</th>
          </tr>
        </thead>
        <tbody>
          {top.map((r) => {
            const share = payouts.total > 0 ? r.fees / payouts.total : 0;
            return (
              <tr
                key={r.id}
                className="border-b border-hairline last:border-0 hover:bg-hover/60"
              >
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <Identity
                      address={r.id}
                      size={22}
                      href={`/orchestrators/${r.id}`}
                    />
                    {r.id === address && (
                      <Badge tone="warning">Its own orchestrator</Badge>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="flex h-1.5 w-20 overflow-hidden rounded-full bg-foreground/8"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "h-full rounded-full",
                          r.self ? "bg-warm" : "bg-foreground/60"
                        )}
                        style={{ width: `${Math.max(share * 100, 1.5)}%` }}
                      />
                    </span>
                    <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                      {(share * 100).toFixed(share < 0.1 ? 1 : 0)}%
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] tabular-nums">
                  {formatETH(r.fees)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] text-muted-foreground tabular-nums">
                  {r.tickets.toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-right text-[13px] whitespace-nowrap text-muted-foreground">
                  {formatRelativeTime(r.lastPaid)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {(payouts.recipients.length > top.length || payouts.truncated) && (
        <p className="border-t border-hairline px-4 py-2.5 text-ui-caption text-muted-foreground">
          {payouts.recipients.length > top.length &&
            `Showing top ${top.length} of ${payouts.recipients.length}. `}
          {payouts.truncated &&
            "Counted from the most recent 10,000 tickets, so totals may run low."}
        </p>
      )}
    </Card>
  );
}

export default function GatewayPage() {
  const params = useParams<{ address: string }>();
  const address = decodeURIComponent(params.address ?? "").toLowerCase();
  const valid = isAddress(address);
  const {
    data: g,
    error,
    isLoading,
    refetch,
  } = useGateway(valid ? address : null);
  const { data: payouts } = useGatewayPayouts(g ? address : undefined);
  const { data: events, isLoading: eventsLoading } = useGatewayEvents(
    g ? address : undefined,
    30
  );
  const { data: orchestrators } = useOrchestrators();
  const { name, avatar } = useIdentity(valid ? address : null);

  const weekly = useMemo(() => {
    if (!g) return [];
    const daily = dailyFees(g.days, 364);
    const weeks: { ts: number; value: number }[] = [];
    for (let i = 0; i < daily.length; i += 7)
      weeks.push({
        ts: daily[i].date,
        value: daily.slice(i, i + 7).reduce((s, d) => s + d.volumeETH, 0),
      });
    // Start the chart where the gateway did.
    const first = weeks.findIndex((w) => w.value > 0);
    return first > 0 ? weeks.slice(first) : weeks;
  }, [g]);

  if (!valid) notFound();

  const isOrchestrator = orchestrators?.some((o) => o.id === address);
  const active = g ? g.ninetyDayVolumeETH > 0 : false;
  const runway = g ? depositRunway(g) : null;
  const selfShare = payouts?.selfShare ?? 0;

  return (
    <Page>
      <Link
        href="/gateways"
        className="mb-6 inline-flex items-center gap-1.5 text-ui-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Gateways
      </Link>

      <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar address={address} src={avatar} size={56} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {g ? (
                active ? (
                  <Badge tone="positive">
                    <StatusDot className="mr-0.5" /> Paying
                  </Badge>
                ) : (
                  <Badge tone="neutral">No fees in 90 days</Badge>
                )
              ) : isLoading ? (
                <Skeleton className="h-5 w-14" />
              ) : null}
              <Badge tone="outline">Gateway</Badge>
            </div>
            <h1 className="truncate text-[28px] leading-8 font-light tracking-[-0.01em]">
              {name ?? (
                <span className="font-mono text-[22px]">
                  {shortAddress(address, 8, 6)}
                </span>
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-caption text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <a
                  href={addressUrl(address)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono hover:text-foreground"
                >
                  {shortAddress(address, 10, 8)}
                </a>
                <CopyButton value={address} />
              </span>
              {g && g.firstActiveDay > 0 && (
                <span>
                  Active since{" "}
                  {formatDate(g.firstActiveDay, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              {g && g.lastActiveDay > 0 && (
                <span>Last paid {formatLastDay(g.lastActiveDay)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOrchestrator && (
            <Button
              size="sm"
              render={<Link href={`/orchestrators/${address}`} />}
            >
              <Server /> Orchestrator profile
            </Button>
          )}
          <Button size="sm" render={<Link href={`/accounts/${address}`} />}>
            <User /> Account
          </Button>
        </div>
      </header>

      {error ? (
        <ErrorNotice error={error} onRetry={() => refetch()} />
      ) : !isLoading && !g ? (
        <Card>
          <EmptyState
            title="Not a gateway"
            description="This address has never funded a deposit or reserve to pay orchestrators."
            action={
              <Link
                href={`/accounts/${address}`}
                className="text-ui-caption text-foreground underline-offset-4 hover:underline"
              >
                View as account
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {selfShare > 0 && (
            <div className="mb-4 flex items-start gap-3 rounded-md border border-warm/30 bg-warm-subtle px-4 py-3">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warm" />
              <p className="text-ui-body text-muted-foreground">
                <span className="text-foreground">
                  {(selfShare * 100).toFixed(selfShare < 0.1 ? 1 : 0)}% of this
                  gateway&apos;s fees in the last 90 days
                </span>{" "}
                went to its own orchestrator. Fees a gateway pays itself
                don&apos;t reflect demand from outside users.
              </p>
            </div>
          )}

          <KpiStrip>
            <Kpi
              label="Fees · 90 days"
              value={
                g ? (
                  formatETH(g.ninetyDayVolumeETH)
                ) : (
                  <Skeleton className="h-6 w-24" />
                )
              }
              sub={g ? `${formatETH(g.thirtyDayVolumeETH)} in 30 days` : null}
            />
            <Kpi
              label="All-time fees"
              value={
                g ? (
                  formatETH(g.totalVolumeETH)
                ) : (
                  <Skeleton className="h-6 w-24" />
                )
              }
              sub={
                payouts
                  ? `${payouts.recipients.length} orchestrators paid in 90 days`
                  : undefined
              }
            />
            <Kpi
              label={
                <Tooltip content={RUNWAY_HINT}>
                  <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
                    Deposit
                  </span>
                </Tooltip>
              }
              value={
                g ? formatETH(g.deposit) : <Skeleton className="h-6 w-24" />
              }
              sub={
                g ? (
                  runway != null ? (
                    <span className={cn(runway < 14 && "text-warm")}>
                      {formatRunway(runway)} at the recent pace
                    </span>
                  ) : (
                    "No recent spend"
                  )
                ) : undefined
              }
            />
            <Kpi
              label="Reserve"
              value={
                g ? formatETH(g.reserve) : <Skeleton className="h-6 w-24" />
              }
              sub={g ? "Backs tickets if the deposit runs out" : undefined}
            />
          </KpiStrip>

          <section className="mt-10">
            <SectionHeader
              title="Fees paid"
              description="Per week, over the last year"
            />
            <Card className="px-2 pt-4 pb-3 sm:px-4">
              {g && weekly.length > 1 ? (
                <TimeSeriesChart
                  ariaLabel="Fees paid per week"
                  data={weekly}
                  kind="bar"
                  color="var(--series-4)"
                  format={(v) => formatETH(v)}
                  axisFormat={(v) => formatNumber(v, { decimals: 2 })}
                  height={220}
                  tooltipTitle={(p) =>
                    `Week of ${formatDate(p.ts, {
                      month: "short",
                      day: "numeric",
                    })}`
                  }
                />
              ) : isLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <EmptyState title="No fees paid yet" />
              )}
            </Card>
          </section>

          <section className="mt-10">
            <SectionHeader
              title="Orchestrators paid"
              description={
                payouts
                  ? `${formatETH(
                      payouts.total
                    )} in winning tickets over the last 90 days`
                  : "Last 90 days"
              }
            />
            {payouts ? (
              <Payouts address={address} payouts={payouts} />
            ) : (
              <Skeleton className="h-48 w-full rounded-md" />
            )}
          </section>

          <section className="mt-10">
            <SectionHeader
              title="Deposits and withdrawals"
              description="How this gateway has funded its payouts"
            />
            <ActivityList
              events={events}
              loading={eventsLoading || isLoading}
              emptyText="No deposits or withdrawals yet."
            />
          </section>
        </>
      )}
    </Page>
  );
}
