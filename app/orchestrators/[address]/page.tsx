"use client";

import { ArrowLeft, ArrowRight, ExternalLink, Globe } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { isAddress } from "viem";

import { TimeSeriesChart } from "@/components/charts/time-series";
import { Avatar, CopyButton, useIdentity } from "@/components/identity";
import { OrchestratorDelegators } from "@/components/orchestrators/delegators";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Kpi,
  KpiStrip,
  Page,
  SectionHeader,
} from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Segmented, Skeleton, StatusDot } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { addressUrl } from "@/lib/config";
import {
  formatDate,
  formatETH,
  formatLPT,
  formatNumber,
  formatRelativeTime,
  fromWei,
  shortAddress,
} from "@/lib/format";
import {
  useOrchestrator,
  usePortfolio,
  useProtocol,
} from "@/lib/hooks/queries";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";
import type { OrchestratorDetail } from "@/lib/subgraph/network";

type Metric = "yield" | "stake" | "fees";

function RewardStrip({
  pools,
  currentRound,
}: {
  pools: OrchestratorDetail["pools"];
  currentRound: number;
}) {
  const recent = pools.filter((p) => p.round < currentRound).slice(-90);
  const called = recent.filter((p) => p.rewardTokens != null).length;
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <span className="text-ui-caption text-muted-foreground">
          Last {recent.length} rounds
        </span>
        <span className="font-mono text-ui-caption tabular-nums">
          {called}/{recent.length} called
        </span>
      </div>
      <div
        className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px] sm:grid-cols-[repeat(45,minmax(0,1fr))]"
        role="img"
        aria-label={`Reward called in ${called} of the last ${recent.length} rounds`}
      >
        {recent.map((p) => {
          const ok = p.rewardTokens != null;
          return (
            <Tooltip
              key={p.round}
              content={`Round ${p.round.toLocaleString()} · ${
                ok
                  ? `${formatLPT(p.rewardTokens!)} minted`
                  : "Reward not called"
              }`}
            >
              <span
                className={cn(
                  "h-5 w-full rounded-[2px] transition-opacity hover:opacity-70",
                  ok ? "bg-foreground/35" : "bg-warm"
                )}
              />
            </Tooltip>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[7px] rounded-[2px] bg-foreground/35" /> Called
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-[7px] rounded-[2px] bg-warm" /> Missed
        </span>
      </div>
    </Card>
  );
}

function CutHistory({ pools }: { pools: OrchestratorDetail["pools"] }) {
  // Only real changes: the first pool in the window is a starting point, not
  // a change.
  const changes: {
    round: number;
    ts: number;
    rewardCut: number;
    feeShare: number;
    prevCut: number;
    prevShare: number;
  }[] = [];
  for (let i = 1; i < pools.length; i++) {
    const a = pools[i - 1];
    const b = pools[i];
    if (a.rewardCut !== b.rewardCut || a.feeShare !== b.feeShare) {
      changes.push({
        round: b.round,
        ts: b.ts,
        rewardCut: b.rewardCut,
        feeShare: b.feeShare,
        prevCut: a.rewardCut,
        prevShare: a.feeShare,
      });
    }
  }
  const current = pools[pools.length - 1];
  if (!current) return null;
  if (!changes.length) {
    return (
      <Card className="px-4 py-3.5">
        <p className="text-ui-body text-muted-foreground">
          Unchanged since round {pools[0].round.toLocaleString()}
        </p>
        <p className="mt-1 font-mono text-[12.5px] tabular-nums">
          {current.rewardCut.toFixed(1)}% cut · {current.feeShare.toFixed(1)}%
          fee share
        </p>
      </Card>
    );
  }
  return (
    <Card className="divide-y divide-(--hairline)">
      {changes
        .reverse()
        .slice(0, 8)
        .map((c) => (
          <div
            key={c.round}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="flex flex-col">
              <span className="text-ui-body">
                {formatDate(c.ts, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="font-mono text-[11px] text-subtle-foreground tabular-nums">
                Round {c.round.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-end font-mono text-[12.5px] tabular-nums">
              {c.rewardCut !== c.prevCut && (
                <span
                  className={c.rewardCut > c.prevCut ? "text-warm" : undefined}
                >
                  cut {c.prevCut.toFixed(1)}% → {c.rewardCut.toFixed(1)}%
                </span>
              )}
              {c.feeShare !== c.prevShare && (
                <span className="text-muted-foreground">
                  share {c.prevShare.toFixed(1)}% → {c.feeShare.toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
    </Card>
  );
}

export default function OrchestratorPage() {
  const params = useParams<{ address: string }>();
  const address = decodeURIComponent(params.address ?? "").toLowerCase();
  const valid = isAddress(address);
  const { data: o, error, isLoading, refetch } = useOrchestrator(address);
  const { data: protocol } = useProtocol();
  const { name, avatar } = useIdentity(valid ? address : null);
  const { walletAddress } = usePortfolioAccounts();
  const { data: mine } = usePortfolio(walletAddress ? [walletAddress] : []);
  const { open } = useStaking();
  const [metric, setMetric] = useState<Metric>("yield");
  const [calc, setCalc] = useState("1000");

  const myPosition = mine?.accounts.find((a) => a.id === walletAddress);
  const myDelegate = myPosition?.delegate;
  const myStake = myPosition ? fromWei(myPosition.pendingStake) : 0;
  const delegatedHere = myDelegate === address && myStake > 0;
  const delegatedElsewhere = Boolean(
    myDelegate && myDelegate !== address && myStake > 0
  );

  const chart = useMemo(() => {
    if (!o) return null;
    const recent = o.pools.slice(-180);
    switch (metric) {
      case "yield":
        return {
          kind: "area" as const,
          color: "var(--series-3)",
          data: recent
            .filter((p) => p.yieldPct != null)
            .map((p) => ({ ts: p.ts, value: p.yieldPct!, round: p.round })),
          format: (v: number) => `${v.toFixed(4)}%`,
          axis: (v: number) => `${v.toFixed(3)}%`,
          label: "Delegator yield per round",
        };
      case "stake":
        return {
          kind: "area" as const,
          color: "var(--series-1)",
          data: recent.map((p) => ({
            ts: p.ts,
            value: p.totalStake,
            round: p.round,
          })),
          format: (v: number) => formatLPT(v),
          axis: (v: number) => formatNumber(v, { decimals: 0, compact: true }),
          label: "Total stake per round",
        };
      case "fees": {
        // One bar per round is a hairline at this range: sum into weeks.
        const weeks: { ts: number; value: number }[] = [];
        for (const p of recent) {
          const last = weeks[weeks.length - 1];
          if (last && p.ts - last.ts < 7 * 86400) last.value += p.fees;
          else weeks.push({ ts: p.ts, value: p.fees });
        }
        return {
          kind: "bar" as const,
          color: "var(--series-4)",
          data: weeks,
          format: (v: number) => formatETH(v),
          axis: (v: number) => formatNumber(v, { decimals: 2 }),
          label: "Fees earned per week",
        };
      }
    }
  }, [o, metric]);

  if (!valid) notFound();

  const share =
    o && protocol ? (o.totalStake / protocol.totalActiveStake) * 100 : null;
  const calcAmount = Number(calc) || 0;
  let host: string | null = null;
  try {
    host = o?.serviceURI ? new URL(o.serviceURI).host : null;
  } catch {
    host = null;
  }

  const cta = delegatedHere
    ? "Delegate more"
    : delegatedElsewhere
    ? "Switch orchestrator"
    : "Delegate";

  return (
    <Page>
      <Link
        href="/orchestrators"
        className="mb-6 inline-flex items-center gap-1.5 text-ui-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Orchestrators
      </Link>

      <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar address={address} src={avatar} size={56} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              {o ? (
                o.active ? (
                  <Badge tone="positive">
                    <StatusDot className="mr-0.5" /> Active
                  </Badge>
                ) : (
                  <Badge tone="warning">Inactive</Badge>
                )
              ) : (
                <Skeleton className="h-5 w-14" />
              )}
              {delegatedHere && <Badge tone="outline">Your orchestrator</Badge>}
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
              {host && (
                <span className="flex items-center gap-1">
                  <Globe className="size-3" /> {host}
                </span>
              )}
              {o && (
                <span>
                  Active since{" "}
                  {formatDate(o.activationTimestamp, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
              <Link
                href={`/activity?q=${address}`}
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                All activity <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {delegatedHere && (
            <Button
              onClick={() =>
                open({ kind: "undelegate", delegate: address, staked: myStake })
              }
            >
              Undelegate
            </Button>
          )}
          <Button
            variant="primary"
            disabled={!o}
            onClick={() => open({ kind: "delegate", to: address })}
          >
            {cta}
          </Button>
        </div>
      </header>

      {error ? (
        <ErrorNotice error={error} onRetry={() => refetch()} />
      ) : !isLoading && !o ? (
        <Card>
          <EmptyState
            title="Not an orchestrator"
            description="This address has never registered as an orchestrator."
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
          {delegatedHere && (
            <div className="mb-4 flex items-center justify-between gap-4 rounded-md border border-hairline px-4 py-3">
              <span className="text-ui-body text-muted-foreground">
                You have{" "}
                <span className="font-mono text-foreground tabular-nums">
                  {formatLPT(myStake)}
                </span>{" "}
                staked here
              </span>
              <Link
                href="/"
                className="text-ui-caption text-foreground underline-offset-4 hover:underline"
              >
                View portfolio
              </Link>
            </div>
          )}

          <KpiStrip>
            <Kpi
              label="Total stake"
              value={
                o ? (
                  formatLPT(o.totalStake, { compact: true })
                ) : (
                  <Skeleton className="h-6 w-24" />
                )
              }
              sub={
                o
                  ? `${
                      share != null ? `${share.toFixed(2)}% of network · ` : ""
                    }${formatLPT(o.selfStake, { compact: true })} self`
                  : undefined
              }
            />
            <Kpi
              label="Realised APR"
              value={
                o ? (
                  o.realizedApr != null ? (
                    `${o.realizedApr.toFixed(2)}%`
                  ) : (
                    "—"
                  )
                ) : (
                  <Skeleton className="h-6 w-16" />
                )
              }
              sub={
                o
                  ? `${o.rewardCalls}/${o.rewardWindow} reward calls`
                  : undefined
              }
            />
            <Kpi
              label="Reward cut · Fee share"
              value={
                o ? (
                  `${o.rewardCut.toFixed(1)}% · ${o.feeShare.toFixed(1)}%`
                ) : (
                  <Skeleton className="h-6 w-28" />
                )
              }
              sub={
                o
                  ? `Updated ${formatRelativeTime(
                      Math.max(
                        o.rewardCutUpdateTimestamp,
                        o.feeShareUpdateTimestamp
                      )
                    )}`
                  : undefined
              }
            />
            <Kpi
              label="Fees · 30 days"
              value={
                o ? (
                  formatETH(o.thirtyDayVolumeETH)
                ) : (
                  <Skeleton className="h-6 w-24" />
                )
              }
              sub={o ? `${formatETH(o.totalVolumeETH)} all time` : undefined}
            />
          </KpiStrip>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-w-0 flex-col gap-10">
              <section>
                <SectionHeader
                  title="Performance"
                  description="Last 180 rounds"
                  action={
                    <Segmented
                      label="Performance metric"
                      value={metric}
                      onChange={setMetric}
                      options={[
                        { value: "yield", label: "Yield" },
                        { value: "stake", label: "Stake" },
                        { value: "fees", label: "Fees" },
                      ]}
                    />
                  }
                />
                <Card className="px-2 pt-4 pb-3 sm:px-4">
                  {chart && chart.data.length > 1 ? (
                    <TimeSeriesChart
                      ariaLabel={chart.label}
                      data={chart.data}
                      kind={chart.kind}
                      color={chart.color}
                      format={chart.format}
                      axisFormat={chart.axis}
                      height={240}
                      tooltipTitle={
                        metric === "fees"
                          ? (p) =>
                              `Week of ${formatDate(p.ts, {
                                month: "short",
                                day: "numeric",
                              })}`
                          : undefined
                      }
                    />
                  ) : (
                    <Skeleton className="h-[240px] w-full" />
                  )}
                </Card>
              </section>

              <section>
                <SectionHeader
                  title="Reward calls"
                  description="Each missed round is inflation its delegators don't receive"
                />
                {o && protocol ? (
                  <RewardStrip
                    pools={o.pools}
                    currentRound={protocol.currentRound}
                  />
                ) : (
                  <Skeleton className="h-28 w-full rounded-md" />
                )}
              </section>

              <section>
                <SectionHeader
                  title="Delegators"
                  description={
                    o
                      ? `${o.delegatorList.length.toLocaleString()} with active stake`
                      : undefined
                  }
                />
                {o ? (
                  <OrchestratorDelegators
                    orchestrator={address}
                    delegators={o.delegatorList}
                    totalStake={o.totalStake}
                  />
                ) : (
                  <Skeleton className="h-64 w-full rounded-md" />
                )}
              </section>
            </div>

            <aside className="flex flex-col gap-10">
              <section>
                <SectionHeader title="Estimate" />
                <Card className="p-5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-ui-caption text-muted-foreground">
                      If you delegate
                    </span>
                    <span className="flex items-baseline gap-2 border-b border-hairline pb-2 focus-within:border-ring">
                      <input
                        value={calc}
                        inputMode="decimal"
                        onChange={(e) =>
                          /^\d*\.?\d*$/.test(e.target.value) &&
                          setCalc(e.target.value)
                        }
                        className="min-w-0 flex-1 bg-transparent font-mono text-[22px] tabular-nums outline-none"
                        aria-label="Amount to estimate, in LPT"
                      />
                      <span className="text-ui-body text-muted-foreground">
                        LPT
                      </span>
                    </span>
                  </label>
                  <dl className="mt-4 flex flex-col gap-2.5">
                    {[
                      ["Per month", 30],
                      ["Per year", 365],
                    ].map(([label, days]) => {
                      const apr = o?.realizedApr ?? 0;
                      const v =
                        calcAmount *
                        (Math.pow(1 + apr / 100, (days as number) / 365) - 1);
                      return (
                        <div
                          key={label}
                          className="flex items-baseline justify-between"
                        >
                          <dt className="text-ui-body text-muted-foreground">
                            {label}
                          </dt>
                          <dd className="font-mono text-[13px] tabular-nums">
                            {o?.realizedApr != null ? `+${formatLPT(v)}` : "—"}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  <p className="mt-4 text-[11px] leading-4 text-subtle-foreground">
                    Based on this orchestrator&apos;s realised yield over the
                    last 30 rounds.
                  </p>
                </Card>
              </section>

              <section>
                <SectionHeader title="Cut history" />
                {o ? (
                  <CutHistory pools={o.pools} />
                ) : (
                  <Skeleton className="h-40 w-full rounded-md" />
                )}
              </section>

              {o && (
                <section>
                  <SectionHeader title="Lifetime commission" />
                  <Card className="flex flex-col gap-2.5 p-5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-ui-body text-muted-foreground">
                        Rewards
                      </span>
                      <span className="font-mono text-[13px] tabular-nums">
                        {formatLPT(o.lifetimeRewardCommission)}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-ui-body text-muted-foreground">
                        Fees
                      </span>
                      <span className="font-mono text-[13px] tabular-nums">
                        {formatETH(o.lifetimeFeeCommission)}
                      </span>
                    </div>
                    <a
                      href={addressUrl(address)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-ui-caption text-muted-foreground hover:text-foreground"
                    >
                      Arbiscan <ExternalLink className="size-3" />
                    </a>
                  </Card>
                </section>
              )}
            </aside>
          </div>
        </>
      )}
    </Page>
  );
}
