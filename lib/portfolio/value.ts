import type { SeriesPoint } from "./compute";

/**
 * What staking added, in USD: the portfolio's value with its staking
 * earnings next to what the same deposits would be worth had they earned
 * nothing, both at each day's prices.
 *
 * Deposits and withdrawals come from the series itself. Between rounds,
 * stake only grows by what it earned, so whatever else moved it,
 *
 *   flow[r] = stake[r] − stake[r−1] − rewards[r]
 *
 * is LPT bonded (positive) or unbonded (negative) that round.
 *
 * Everything is counted as if kept: LPT taken out of staking stays in the
 * "with staking" line, valued at each day's price like the stake, and fees
 * stay in it as ETH at each day's ETH price. Whether someone sold isn't
 * something we can know; assuming they did would freeze withdrawals at the
 * price of the day and hide a later crash. So:
 *
 *   with[r]    = (stake[r] + withdrawn so far) · LPT[r] + fees so far · ETH[r]
 *   without[r] = deposited so far · LPT[r]
 *
 * and the gap is every LPT earned, plus fees, at that day's prices.
 *
 * Stake moved between two wallets of the same portfolio (transferBond) is
 * neither a deposit nor a withdrawal, and a deposit after a withdrawal is
 * taken as that LPT coming back before any new money.
 */

export type BondTransfer = {
  round: number;
  from: string;
  to: string;
  /** LPT */
  amount: number;
};

export type AccountSeries = { id: string; series: SeriesPoint[] };

/** LPT moved into and out of the portfolio's stake, so far, by round. */
export type Flows = {
  /** New LPT put in: deposits beyond any withdrawn LPT coming back. */
  deposited: number;
  /** LPT taken out and not (yet) staked again: counted as kept. */
  withdrawn: number;
};

/** Below this, a flow is rounding, not a deposit or withdrawal. */
const tolerance = (stake: number) => Math.max(1e-6, stake * 1e-9);

/** Running deposits and withdrawals per round, summed across the accounts. */
export function flowsByRound(
  accounts: AccountSeries[],
  transfers: BondTransfer[] = []
): Map<number, Flows> {
  const ids = new Set(accounts.map((a) => a.id.toLowerCase()));
  // LPT each account sent to or received from another account here, by
  // round: a move within the portfolio, so neither deposit nor withdrawal.
  const internal = new Map<string, number>();
  const key = (id: string, round: number) => `${id}:${round}`;
  for (const t of transfers) {
    const from = t.from.toLowerCase();
    const to = t.to.toLowerCase();
    if (from === to || !ids.has(from) || !ids.has(to)) continue;
    const out = key(from, t.round);
    const into = key(to, t.round);
    internal.set(out, (internal.get(out) ?? 0) - t.amount);
    internal.set(into, (internal.get(into) ?? 0) + t.amount);
  }

  const state = accounts.map((a) => ({
    id: a.id.toLowerCase(),
    points: new Map(a.series.map((p) => [p.round, p])),
    prevStake: 0,
  }));
  const rounds = [
    ...new Set(accounts.flatMap((a) => a.series.map((p) => p.round))),
  ].sort((a, b) => a - b);

  const out = new Map<number, Flows>();
  let deposited = 0;
  let withdrawn = 0;
  for (const r of rounds) {
    let added = 0;
    let removed = 0;
    for (const s of state) {
      const p = s.points.get(r);
      if (!p) continue;
      const before = s.prevStake + p.rewards;
      let external = p.stake - before - (internal.get(key(s.id, r)) ?? 0);
      if (Math.abs(external) < tolerance(before)) external = 0;
      if (external > 0) added += external;
      else removed -= external;
      s.prevStake = p.stake;
    }
    // Withdrawals count as kept, so a later deposit is that LPT coming
    // back first (unbonded from one wallet and bonded into another, or
    // re-staked), and only the rest is new money. Otherwise it would be
    // counted twice: once as kept and again as stake.
    withdrawn += removed;
    const back = Math.min(added, withdrawn);
    withdrawn -= back;
    deposited += added - back;
    out.set(r, { deposited, withdrawn });
  }
  return out;
}

export type ValuePoint = {
  round: number;
  ts: number;
  /** USD per LPT that round. */
  lptPrice: number;
  /** LPT behind the "with staking" value: staked plus taken out. */
  withLpt: number;
  /** LPT behind the "without staking" value: everything deposited. */
  withoutLpt: number;
  /** ETH fees earned so far, in the "with staking" value. */
  feesEth: number;
  withStaking: number;
  withoutStaking: number;
};

/**
 * Both values per round, in USD. Rounds without an LPT price are left out;
 * fees use the latest ETH price known by then.
 */
export function valueSeries(
  series: SeriesPoint[],
  flows: Map<number, Flows>,
  prices: { lpt: (number | null)[]; eth: (number | null)[] }
): ValuePoint[] {
  const out: ValuePoint[] = [];
  let feesEth = 0;
  let eth: number | null = null;
  series.forEach((p, i) => {
    feesEth += p.fees;
    eth = prices.eth[i] ?? eth;
    const lpt = prices.lpt[i];
    if (lpt == null) return;
    const f = flows.get(p.round) ?? { deposited: 0, withdrawn: 0 };
    const withLpt = p.stake + f.withdrawn;
    out.push({
      round: p.round,
      ts: p.ts,
      lptPrice: lpt,
      withLpt,
      withoutLpt: f.deposited,
      feesEth,
      withStaking: withLpt * lpt + feesEth * (eth ?? 0),
      withoutStaking: f.deposited * lpt,
    });
  });
  return out;
}
