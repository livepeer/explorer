"use client";

import { AlertTriangle, ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
import { cn } from "@/lib/cn";
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
import type { PortfolioAccount } from "@/lib/hooks/watchlist";
import {
  annualize,
  annualizeFees,
  averageRoundSeconds,
  projectEarnings,
  sumSince,
  trailingCommission,
  trailingFeeRate,
  trailingRoundRate,
} from "@/lib/portfolio/compute";

import { IdleLptAction, useIdleLpt } from "./delegate";
import { ExportEarnings } from "./export-earnings";
import { PortfolioHero } from "./hero";
import {
  PositionActions,
  PositionLabel,
  PositionNote,
} from "./position-header";
import { DUST_ETH, LPT_DUST, type Position, Positions } from "./positions";
import { safeInsights } from "./safe-insights";
import {
  type Insight,
  insightOrchestrator,
  Insights,
  PendingWithdrawals,
  Projections,
} from "./side-panels";
import { useVoteInsights } from "./vote-insights";
import { WithdrawFees } from "./withdraw-fees";

/** "3 wallets", or "2 delegations · 3 wallets" when some have none. */
function delegationCount(delegations: number, wallets: number) {
  const w = `${wallets} wallet${wallets === 1 ? "" : "s"}`;
  if (delegations === wallets) return w;
  return `${delegations} delegation${delegations === 1 ? "" : "s"} · ${w}`;
}

/**
 * Pins its column under the app header (desktop) only when all of it fits
 * on screen; taller, it scrolls with the page, so nothing is cut off.
 */
function StickyIfFits({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fits, setFits] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 72px: the pinned header and its inset, plus room below.
    const check = () => setFits(el.offsetHeight <= window.innerHeight - 88);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);
  return (
    <div
      ref={ref}
      className={cn("flex flex-col", fits && "xl:sticky xl:top-[72px]")}
    >
      {children}
    </div>
  );
}

export function PortfolioView({
  accounts,
  canManage,
  showScope = true,
  header,
}: {
  accounts: PortfolioAccount[];
  canManage: (address: string) => boolean;
  /** The portfolio page (all your wallets), rather than one account's. */
  showScope?: boolean;
  /** The page's own header, leading the main column (so a rail beside it
   *  starts level with it). */
  header?: React.ReactNode;
}) {
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  // Every account given: the portfolio is all your wallets, and one wallet
  // has its own page (the sidebar switcher goes to it).
  const scoped = addresses;

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
    const series = data.series;
    const stake = fromWei(accts.reduce((s, a) => s + a.pendingStake, 0n));
    const fees = fromWei(accts.reduce((s, a) => s + a.pendingFees, 0n));
    const roundSeconds = averageRoundSeconds(data.rounds);
    const rate = trailingRoundRate(series);
    const apr = annualize(rate, roundSeconds);
    const feeRate = trailingFeeRate(series);
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
          delegatorRewards30d:
            sumSince(s, "rewards", since30) -
            sumSince(s, "commission", since30),
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
      feeRate,
      rewards30,
      fees30,
      share,
      lastReward,
      positions,
      unbonding,
    };
  }, [data, scoped, accounts, nowSec]);

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
  // Any unstaked LPT beyond dust: what "Delegate more" can add. The prompt
  // above uses a higher bar (a balance worth nudging about).
  const free = useIdleLpt(manageable, LPT_DUST);
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
        // Every wallet delegated to it, each counting its own delegator
        // rewards (commission is tracked apart), so the estimate covers the
        // whole portfolio and doesn't depend on which wallet comes first.
        const rewards30d = view.positions
          .filter((p) => p.delegate === d)
          .reduce((s, p) => s + p.delegatorRewards30d, 0);
        const perRound = o.rewardCalls > 0 ? rewards30d / o.rewardCalls : 0;
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
    // Unlocked stake isn't listed here: the Pending withdrawals card on the
    // same page shows it whenever there's any, with its Withdraw button.
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
  const single = scoped.length === 1;
  const idleAction = view && (
    <IdleLptAction idle={idle} accounts={accounts} positions={view.positions} />
  );
  const lpt = prices?.lpt;
  // Realised APR is rewards plus fees, as on the Orchestrators page: fees
  // valued in LPT at today's prices (left out, and said so, without them).
  const feeApr =
    view && lpt && prices?.eth
      ? annualizeFees(view.feeRate, view.roundSeconds, prices.eth / lpt)
      : null;
  const aprSplit = view && (
    <span className="flex flex-col gap-1">
      <span>
        Rewards {view.apr.toFixed(2)}%, realised over the last 30 rounds and
        compounded to a year.
      </span>
      {feeApr != null ? (
        <span>
          Fees {feeApr.toFixed(2)}%, from the same rounds, valued at
          today&apos;s ETH/LPT price.
        </span>
      ) : (
        <span>Fees aren&apos;t counted: prices are unavailable.</span>
      )}
      <span>Not a promise: inflation, reward calls and cuts all move it.</span>
    </span>
  );
  // Problems costing the delegator rewards, lifted to the top of the page;
  // votes, Safe actions and withdrawals wait in the list below.
  const urgent = insights.filter((i) => i.tone === "warning");
  // Connected wallets with fees to withdraw, most first.
  const withdrawable =
    view?.positions
      .filter((p) => canManage(p.account.address) && p.fees >= DUST_ETH)
      .sort((a, b) => b.fees - a.fees) ?? [];

  const heroEl = (slots?: {
    label: React.ReactNode;
    position: React.ReactNode;
    actions: React.ReactNode;
  }) => (
    <PortfolioHero
      variant={single ? "page" : "card"}
      label={slots?.label}
      position={slots?.position}
      positionActions={slots?.actions}
      series={view?.series ?? []}
      stake={view?.stake ?? 0}
      lptPrice={lpt}
      nowSec={nowSec}
      loading={loading}
      actions={
        data && (
          <ExportEarnings
            name={
              showScope
                ? "portfolio"
                : accounts[0]?.label ?? accounts[0]?.address ?? ""
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
  );
  const insightsEl = insights.length > 0 && (
    <Section id="needs-attention">
      <SectionHeader
        title="Needs attention"
        description="Open votes, pending Safe actions, and your orchestrators' last 30 rounds"
      />
      <Insights items={insights} />
    </Section>
  );
  const activityEl = (
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
  );
  // On one wallet's page, unclaimed fees join unlocked stake here, so
  // everything you can take out of the protocol is in one place (the
  // portfolio shows fees in its tile instead).
  const feeItems =
    single && view
      ? view.positions
          .filter((p) => p.fees >= DUST_ETH)
          .map((p) => ({ account: p.account.address, amount: p.fees }))
      : [];
  const unbondingLpt = view
    ? view.unbonding.reduce((s, l) => s + l.amount, 0)
    : 0;
  const withdrawalsEl = view &&
    data &&
    (view.unbonding.length > 0 || feeItems.length > 0) && (
      <section>
        <SectionHeader
          title="Withdrawals"
          description={[
            unbondingLpt > 0 && `${formatLPT(unbondingLpt)} undelegating`,
            feeItems.length > 0 &&
              `${formatETH(
                feeItems.reduce((s, f) => s + f.amount, 0)
              )} in fees`,
          ]
            .filter(Boolean)
            .join(" · ")}
        />
        <PendingWithdrawals
          locks={view.unbonding}
          currentRound={data.currentRound}
          roundSeconds={view.roundSeconds}
          canManage={canManage}
          fees={feeItems}
          ethPrice={prices?.eth}
        />
      </section>
    );

  // One wallet, brokerage-style: the main column is about time (balance
  // history, what needs attention, activity), the rail beside it about now:
  // the position and what you can do with it, pinned as you scroll. The
  // page's own header leads the main column, so the rail starts level with
  // it. Below xl the position card follows the balance instead.
  if (single) {
    const account = accounts.find((a) => a.address === scoped[0]);
    // An account with nothing delegated still gets a card, to start from.
    const position: Position | undefined =
      view?.positions[0] ??
      (account && {
        account,
        delegate: null,
        stake: 0,
        fees: 0,
        rewards30d: 0,
        delegatorRewards30d: 0,
        trend: [],
        active: false,
      });
    const manage = position ? canManage(position.account.address) : false;
    const freeLpt = free.get(scoped[0]);
    const positionEl = (
      <PositionNote
        loading={loading}
        position={position}
        canManage={manage}
        freeLpt={freeLpt}
      />
    );
    // What needs doing and what's coming out, beside the balance; without
    // either, the balance and its chart take the full width.
    const hasAside = Boolean(insightsEl || withdrawalsEl);
    return (
      <div className="flex flex-col">
        {urgent.length > 0 && (
          <a
            href="#needs-attention"
            className="mb-5 flex items-center gap-2.5 rounded-md bg-warm-subtle px-3.5 py-2.5 text-ui-caption text-warm transition-colors hover:bg-warm-subtle/80"
          >
            <AlertTriangle className="size-3.5 shrink-0" />
            <span className="min-w-0 flex-1 truncate">
              {urgent[0].title}
              {urgent.length > 1 && ` · and ${urgent.length - 1} more`}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              Review <ArrowDown className="size-3" />
            </span>
          </a>
        )}
        {/* Brokerage-style. Wide: the account, its balance and position,
            and its history on the left, then activity; on the right, from
            the very top, what needs doing, pinned as you scroll. Narrow:
            the same order in one column. */}
        <div
          className={cn(
            "grid grid-cols-1 gap-x-8",
            hasAside && "xl:grid-cols-[minmax(0,1fr)_320px]"
          )}
        >
          <div className="min-w-0 xl:col-start-1 xl:row-start-1">{header}</div>
          <div className="min-w-0 animate-rise xl:col-start-1 xl:row-start-2">
            {heroEl({
              label: <PositionLabel loading={loading} position={position} />,
              position: positionEl,
              actions: (
                <PositionActions
                  loading={loading}
                  position={position}
                  canManage={manage}
                  freeLpt={freeLpt}
                />
              ),
            })}
          </div>
          {hasAside && (
            <aside className="mt-10 flex flex-col gap-8 animate-rise [animation-delay:60ms] xl:col-start-2 xl:row-span-3 xl:row-start-1 xl:mt-0">
              <StickyIfFits>
                {insightsEl}
                {withdrawalsEl && (
                  <div className={cn(insightsEl && "mt-8")}>
                    {withdrawalsEl}
                  </div>
                )}
              </StickyIfFits>
            </aside>
          )}
          <div className="mt-10 min-w-0 xl:col-start-1 xl:row-start-3">
            {activityEl}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {header}
      {urgent.length > 0 && (
        <a
          href="#needs-attention"
          className="mb-5 flex items-center gap-2.5 rounded-md bg-warm-subtle px-3.5 py-2.5 text-ui-caption text-warm transition-colors hover:bg-warm-subtle/80"
        >
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            {urgent[0].title}
            {urgent.length > 1 && ` · and ${urgent.length - 1} more`}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            Review <ArrowDown className="size-3" />
          </span>
        </a>
      )}
      <div className="animate-rise">{heroEl()}</div>

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
              <Tooltip content={aprSplit}>
                <span className="cursor-help underline decoration-dotted decoration-foreground/30 underline-offset-4">
                  Realised APR
                </span>
              </Tooltip>
            }
            value={
              loading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                `${(view!.apr + (feeApr ?? 0)).toFixed(2)}%`
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

      {insightsEl && <div className="mt-10">{insightsEl}</div>}

      <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-10">
          <section>
            <SectionHeader
              title="Delegations"
              description={
                view
                  ? delegationCount(view.positions.length, scoped.length)
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
          </section>
          {activityEl}
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
          {withdrawalsEl}
        </aside>
      </div>
    </div>
  );
}
