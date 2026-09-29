"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo } from "react";

import { ActivityList } from "@/components/activity-list";
import {
  ErrorNotice,
  Kpi,
  KpiStrip,
  Section,
  SectionHeader,
} from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { useStaking } from "@/components/staking/staking";
import { Skeleton } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { trackEventOnce } from "@/lib/analytics";
import {
  formatETH,
  formatLPT,
  formatNumber,
  formatUSD,
  fromWei,
} from "@/lib/format";
import {
  useAccountEvents,
  useOrchestrators,
  useOrchestratorUpdates,
  usePortfolio,
  usePrices,
  useProtocol,
} from "@/lib/hooks/queries";
import { useSafeProposals } from "@/lib/hooks/safe";
import { useViewScope } from "@/lib/hooks/view-scope";
import type { PortfolioAccount } from "@/lib/hooks/watchlist";
import {
  annualize,
  averageRoundSeconds,
  mergeSeries,
  projectEarnings,
  sumSince,
  trailingCommission,
  trailingRoundRate,
} from "@/lib/portfolio/compute";
import type { Orchestrator } from "@/lib/subgraph/network";

import { IdleLptAction, useIdleLpt } from "./delegate";
import { ExportEarnings } from "./export-earnings";
import { PortfolioHero } from "./hero";
import { DelegationCard, type Position, Positions } from "./positions";
import { safeInsights } from "./safe-insights";
import { ScopeBar } from "./scope-bar";
import {
  type Insight,
  insightOrchestrator,
  Insights,
  PendingWithdrawals,
  Projections,
} from "./side-panels";
import { useVoteInsights } from "./vote-insights";
import { WithdrawFees } from "./withdraw-fees";

/** One account's delegation, including an account with nothing delegated. */
function SingleDelegation({
  position,
  account,
  orchestrators,
  canManage,
}: {
  position: Position | undefined;
  account: PortfolioAccount | undefined;
  orchestrators: Map<string, Orchestrator>;
  canManage: (address: string) => boolean;
}) {
  const p: Position | undefined =
    position ??
    (account && {
      account,
      delegate: null,
      stake: 0,
      fees: 0,
      rewards30d: 0,
      trend: [],
      active: false,
    });
  if (!p) return null;
  return (
    <DelegationCard
      position={p}
      orchestrator={p.delegate ? orchestrators.get(p.delegate) : undefined}
      canManage={canManage(p.account.address)}
    />
  );
}

export function PortfolioView({
  accounts,
  canManage,
  showScope = true,
}: {
  accounts: PortfolioAccount[];
  canManage: (address: string) => boolean;
  showScope?: boolean;
}) {
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  // The home portfolio follows the sidebar switcher; a single-account page
  // always shows that account.
  const [sharedScope, setScope] = useViewScope(addresses);
  const scope = showScope ? sharedScope : "all";
  const scoped = useMemo(
    () => (scope === "all" ? addresses : [scope]),
    [scope, addresses]
  );

  const { data, error, isLoading, refetch } = usePortfolio(addresses);
  const { data: protocol } = useProtocol();
  const { data: prices } = usePrices();
  const { data: orchestratorList } = useOrchestrators();
  const now = useNow(5000);
  const nowSec = Math.floor(now / 1000);
  const { open } = useStaking();

  // The connected wallet's own delegations: the previous explorer's
  // Delegating tab on your own account.
  const connected = accounts.find((a) => a.connected)?.address;
  useEffect(() => {
    if (connected) trackEventOnce("account_delegating_tab_viewed", connected);
  }, [connected]);

  const orchestrators = useMemo(
    () => new Map((orchestratorList ?? []).map((o) => [o.id, o])),
    [orchestratorList]
  );

  const view = useMemo(() => {
    if (!data) return null;
    const accts = data.accounts.filter((a) => scoped.includes(a.id));
    const series =
      scope === "all"
        ? data.series
        : mergeSeries(
            accts.map((a) => a.series),
            data.rounds
          );
    const stake = fromWei(accts.reduce((s, a) => s + a.pendingStake, 0n));
    const fees = fromWei(accts.reduce((s, a) => s + a.pendingFees, 0n));
    const roundSeconds = averageRoundSeconds(data.rounds);
    const rate = trailingRoundRate(series);
    const apr = annualize(rate, roundSeconds);
    const commission = trailingCommission(series);
    const since30 = nowSec - 30 * 86400;
    const rewards30 = sumSince(series, "rewards", since30);
    const fees30 = sumSince(series, "fees", since30);
    const share = series.length ? series[series.length - 1].share : null;
    const lastReward =
      [...series].reverse().find((p) => p.rewards > 0)?.rewards ?? 0;

    const positions: Position[] = accounts
      .filter((a) => scoped.includes(a.address))
      .map((account) => {
        const r = accts.find((x) => x.id === account.address);
        const d = data.delegators.find((x) => x.id === account.address);
        const s = r?.series ?? [];
        return {
          account,
          delegate: r?.delegate ?? null,
          stake: r ? fromWei(r.pendingStake) : 0,
          fees: r ? fromWei(r.pendingFees) : 0,
          rewards30d: sumSince(s, "rewards", since30),
          trend: s.slice(-30).map((p) => p.stake),
          active: d?.delegate?.active ?? true,
        };
      })
      .filter((p) => p.stake > 0 || p.fees > 0 || p.delegate)
      .sort((a, b) => b.stake - a.stake);

    const unbonding = data.unbonding.filter((l) => scoped.includes(l.account));

    return {
      series,
      stake,
      commission,
      fees,
      roundSeconds,
      rate,
      apr,
      rewards30,
      fees30,
      share,
      lastReward,
      positions,
      unbonding,
    };
  }, [data, scope, scoped, accounts, nowSec]);

  const delegates = useMemo(
    () => [
      ...new Set(
        (view?.positions ?? [])
          .map((p) => p.delegate)
          .filter(Boolean) as string[]
      ),
    ],
    [view]
  );
  const { data: updates } = useOrchestratorUpdates(
    delegates,
    nowSec - 30 * 86400
  );
  const { data: events, isLoading: eventsLoading } = useAccountEvents(
    scoped,
    12
  );

  const proposals = useSafeProposals(scoped);
  // Addresses you can act for, and the unstaked LPT they hold.
  const manageable = useMemo(
    () => scoped.filter((a) => canManage(a)),
    [scoped, canManage]
  );
  const idle = useIdleLpt(manageable);
  const holdings = useMemo(
    () =>
      (view?.positions ?? []).map((p) => ({
        account: p.account.address,
        delegate: p.delegate,
        stake: p.stake,
      })),
    [view]
  );
  const votes = useVoteInsights(holdings);
  const insights = useMemo<Insight[]>(() => {
    if (!view || !data) return [];
    // Actions waiting on a Safe's signers come first: they're blocked on you.
    const out: Insight[] = safeInsights(proposals, accounts);
    // Then open votes, soonest to close first.
    out.push(...votes);
    for (const d of delegates) {
      const o = orchestrators.get(d);
      const pos = view.positions.find((p) => p.delegate === d);
      if (pos && !pos.active) {
        out.push({
          id: `inactive-${d}`,
          tone: "warning",
          kind: "inactive",
          href: `/orchestrators/${d}`,
          title: (
            <>
              {insightOrchestrator(d)} is not in the active set, so your stake
              with it isn&apos;t earning.
            </>
          ),
          detail: "Consider switching to an active orchestrator.",
        });
        continue;
      }
      if (o && o.rewardWindow > 0 && o.rewardCalls < o.rewardWindow) {
        const missed = o.rewardWindow - o.rewardCalls;
        // This position's own average reward per called round, so a
        // commission-earning account elsewhere in the portfolio can't skew it.
        const perRound =
          pos && o.rewardCalls > 0 ? pos.rewards30d / o.rewardCalls : 0;
        out.push({
          id: `missed-${d}`,
          tone: missed >= 3 ? "warning" : "info",
          kind: "missed",
          href: `/orchestrators/${d}`,
          title: (
            <>
              {insightOrchestrator(d)} missed {missed} of the last{" "}
              {o.rewardWindow} reward calls
            </>
          ),
          detail:
            perRound > 0
              ? `Roughly ${formatLPT(
                  missed * perRound
                )} of rewards you didn't receive.`
              : undefined,
        });
      }
    }
    // Most recent cut change per orchestrator in the last 30 days.
    const seen = new Set<string>();
    for (const u of updates ?? []) {
      if (!u.delegate || seen.has(u.delegate)) continue;
      seen.add(u.delegate);
      const prev = (updates ?? []).find(
        (x) => x.delegate === u.delegate && x.timestamp < u.timestamp
      );
      const parts: string[] = [];
      const pct = (v?: number) => `${v?.toFixed(1)}%`;
      if (!prev || prev.rewardCut !== u.rewardCut) {
        parts.push(
          prev
            ? `reward cut ${pct(prev.rewardCut)} → ${pct(u.rewardCut)}`
            : `reward cut to ${pct(u.rewardCut)}`
        );
      }
      if (!prev || prev.feeShare !== u.feeShare) {
        parts.push(
          prev
            ? `fee share ${pct(prev.feeShare)} → ${pct(u.feeShare)}`
            : `fee share to ${pct(u.feeShare)}`
        );
      }
      if (!parts.length) continue;
      const raised = prev && (u.rewardCut ?? 0) > (prev.rewardCut ?? 0);
      out.push({
        id: `cut-${u.id}`,
        tone: raised ? "warning" : "info",
        kind: "cut",
        href: `/orchestrators/${u.delegate}`,
        title: (
          <>
            {insightOrchestrator(u.delegate)}{" "}
            {parts.some((x) => x.includes("→")) ? "changed" : "set"} its{" "}
            {parts.join(" and ")}
          </>
        ),
        detail: new Date(u.timestamp * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      });
    }
    const ready = view.unbonding.filter(
      (l) => l.withdrawRound <= data.currentRound
    );
    if (ready.length) {
      const total = ready.reduce((s, l) => s + l.amount, 0);
      out.push({
        id: "withdraw-ready",
        tone: "positive",
        kind: "withdraw",
        title: (
          <>
            {formatLPT(total)} has unlocked and is ready to withdraw or
            redelegate.
          </>
        ),
      });
    }
    return out;
  }, [
    view,
    data,
    delegates,
    orchestrators,
    updates,
    proposals,
    accounts,
    votes,
  ]);

  if (error) return <ErrorNotice error={error} onRetry={() => refetch()} />;

  const loading = isLoading || !view;
  const idleAction = view && (
    <IdleLptAction idle={idle} accounts={accounts} positions={view.positions} />
  );
  const perRound = view ? view.stake * view.rate + view.commission : 0;
  const lpt = prices?.lpt;
  // Connected wallets with fees to withdraw, most first.
  const withdrawable =
    view?.positions
      .filter((p) => canManage(p.account.address) && p.fees > 0)
      .sort((a, b) => b.fees - a.fees) ?? [];

  return (
    <div className="flex flex-col">
      {showScope && (
        <div className="mb-5">
          <ScopeBar accounts={accounts} scope={scope} onScope={setScope} />
        </div>
      )}

      <div className="animate-rise">
        <PortfolioHero
          series={view?.series ?? []}
          stake={view?.stake ?? 0}
          lptPrice={lpt}
          perRound={perRound}
          nowSec={nowSec}
          loading={loading}
          actions={
            data && (
              <ExportEarnings
                name={
                  scope === "all"
                    ? showScope
                      ? "portfolio"
                      : accounts[0]?.label ?? accounts[0]?.address ?? ""
                    : accounts.find((a) => a.address === scope)?.label ?? scope
                }
                accounts={data.accounts
                  .filter((a) => scoped.includes(a.id))
                  .map((a) => ({
                    address: a.id,
                    label: accounts.find((x) => x.address === a.id)?.label,
                    series: a.series,
                  }))}
              />
            )
          }
        />
      </div>

      <div className="mt-4 animate-rise [animation-delay:60ms]">
        <KpiStrip>
          <Kpi
            label="Rewards · 30 days"
            value={
              loading ? (
                <Skeleton className="h-6 w-28" />
              ) : (
                <>
                  +
                  {formatNumber(view!.rewards30, {
                    decimals: view!.rewards30 >= 1000 ? 0 : 2,
                  })}{" "}
                  <span className="text-[15px] text-muted-foreground">LPT</span>
                </>
              )
            }
            sub={
              lpt != null && view ? formatUSD(view.rewards30 * lpt) : undefined
            }
          />
          <Kpi
            label={
              <Tooltip content="Your realised yield over the last 30 rounds, compounded to a year. Not a promise: inflation, reward calls and cuts all move it.">
                <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
                  Realised APR
                </span>
              </Tooltip>
            }
            value={
              loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                `${view!.apr.toFixed(2)}%`
              )
            }
            sub={
              view && view.commission > 0
                ? "On your own stake, excluding commission"
                : view && protocol
                ? `Inflation ${(protocol.inflation / 1e7).toFixed(
                    4
                  )}% per round`
                : undefined
            }
          />
          <Kpi
            label="Unclaimed fees"
            value={
              loading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                formatETH(view!.fees)
              )
            }
            sub={
              withdrawable.length ? (
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  {view && prices?.eth != null && (
                    <span>{formatUSD(view.fees * prices.eth)}</span>
                  )}
                  <WithdrawFees
                    withdrawable={withdrawable}
                    totalFees={view?.fees ?? 0}
                    onWithdraw={(p) =>
                      open({
                        kind: "withdrawFees",
                        amount: p.fees,
                        account: p.account.address,
                      })
                    }
                  />
                </span>
              ) : view && prices?.eth != null ? (
                formatUSD(view.fees * prices.eth)
              ) : view ? (
                `${formatETH(view.fees30)} earned in 30 days`
              ) : undefined
            }
          />
          <Kpi
            label="Network share"
            value={
              loading ? (
                <Skeleton className="h-6 w-20" />
              ) : view!.share != null ? (
                `${view!.share.toFixed(4)}%`
              ) : (
                "—"
              )
            }
            sub={
              protocol
                ? `of ${formatLPT(protocol.totalActiveStake, {
                    compact: true,
                  })} staked`
                : undefined
            }
          />
        </KpiStrip>
      </div>

      {insights.length > 0 && (
        <Section className="mt-10">
          <SectionHeader
            title="Needs attention"
            description="Open votes, pending Safe actions, and your orchestrators' last 30 rounds"
          />
          <Insights items={insights} />
        </Section>
      )}

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-10">
          <section>
            {scoped.length === 1 ? (
              <>
                <SectionHeader title="Delegation" action={idleAction} />
                {loading ? (
                  <Skeleton className="h-44 w-full rounded-md" />
                ) : (
                  <SingleDelegation
                    position={view!.positions[0]}
                    account={accounts.find((a) => a.address === scoped[0])}
                    orchestrators={orchestrators}
                    canManage={canManage}
                  />
                )}
              </>
            ) : (
              <>
                <SectionHeader
                  title="Delegations"
                  description={
                    view
                      ? `${view.positions.length} across ${scoped.length} wallets`
                      : undefined
                  }
                  action={idleAction}
                />
                {loading ? (
                  <Skeleton className="h-40 w-full rounded-md" />
                ) : (
                  <Positions
                    positions={view!.positions}
                    orchestrators={orchestrators}
                    total={view!.stake}
                    canManage={canManage}
                    showAccount
                  />
                )}
              </>
            )}
          </section>

          <section>
            <SectionHeader
              title="Recent activity"
              action={
                scoped.length === 1 ? (
                  <Link
                    href={`/activity?q=${scoped[0]}`}
                    className="inline-flex items-center gap-1 text-ui-caption text-muted-foreground hover:text-foreground"
                  >
                    All activity <ArrowRight className="size-3" />
                  </Link>
                ) : undefined
              }
            />
            <ActivityList
              events={events}
              loading={eventsLoading}
              emptyText="No staking activity for these accounts yet."
            />
          </section>
        </div>

        <aside className="flex flex-col gap-10">
          <section>
            <SectionHeader title="Projected earnings" />
            {loading ? (
              <Skeleton className="h-56 w-full rounded-md" />
            ) : (
              <Projections
                apr={view!.apr}
                commissionPerRound={view!.commission}
                lptPrice={lpt}
                rows={[
                  {
                    label: "Day",
                    lpt: projectEarnings(
                      view!.stake,
                      view!.rate,
                      1,
                      view!.roundSeconds,
                      view!.commission
                    ),
                  },
                  {
                    label: "Week",
                    lpt: projectEarnings(
                      view!.stake,
                      view!.rate,
                      7,
                      view!.roundSeconds,
                      view!.commission
                    ),
                  },
                  {
                    label: "Month",
                    lpt: projectEarnings(
                      view!.stake,
                      view!.rate,
                      30,
                      view!.roundSeconds,
                      view!.commission
                    ),
                  },
                  {
                    label: "Year",
                    lpt: projectEarnings(
                      view!.stake,
                      view!.rate,
                      365,
                      view!.roundSeconds,
                      view!.commission
                    ),
                  },
                ]}
              />
            )}
          </section>

          {view && view.unbonding.length > 0 && data && (
            <section>
              <SectionHeader
                title="Pending withdrawals"
                description={`${formatLPT(
                  view.unbonding.reduce((s, l) => s + l.amount, 0)
                )} undelegating`}
              />
              <PendingWithdrawals
                locks={view.unbonding}
                currentRound={data.currentRound}
                roundSeconds={view.roundSeconds}
                canManage={canManage}
              />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
