/**
 * Portfolio reconstruction from the staging subgraph's cumulative factors.
 *
 * A delegator's claim on an orchestrator's pool is expressed in `shares`,
 * which only change on bond / unbond / rebond / transferBond. Every such
 * event writes a `DelegatorSnapshot`, so between snapshots shares are
 * constant and
 *
 *   stake[r]  = shares[r] · CRF_D[r] / 10^27
 *   reward[r] = shares[r-1] · (CRF_D[r] − CRF_D[r-1]) / 10^27
 *   fees[r]   = shares[r-1] · (CFF_D[r] − CFF_D[r-1]) / 10^27
 *
 * where D is the orchestrator the shares were delegated to. Rewards come
 * from factor *growth*, never from stake differences, so principal moves
 * (bond, unbond, and especially transferBond) are never misread as earnings.
 * Round r's reward is attributed to the shares held going into round r:
 * stake bonded during round r is not in that round's pool.
 *
 * An orchestrator that delegates to itself additionally earns commission
 * (its reward cut, plus rewards on the commission it has staked) which sits
 * outside its shares until claimed. That is reconstructed per round and
 * reset on every claim — each of its snapshot rounds — mirroring
 * `Transcoder.pendingRewardCommission`.
 */

export const PRECISE = 10n ** 27n;
const PPM = 1_000_000n;

export type PoolPoint = {
  round: number;
  crf: bigint;
  cff: bigint;
  /** Reward minted to the pool this round, in wei. Null if reward wasn't called. */
  rewardTokens: bigint | null;
  rewardCut: bigint;
  feeShare: bigint;
  totalStake: bigint;
  fees: bigint;
};

export type Snapshot = {
  account: string;
  delegate: string | null;
  round: number;
  shares: bigint;
};

export type RoundPoint = {
  round: number;
  ts: number;
  totalActiveStake: number;
};

export type AccountState = {
  id: string;
  delegate: string | null;
  shares: bigint;
  /** Claimed-but-unwithdrawn fees, wei. */
  fees: bigint;
  lastClaimRound: number;
  /** Only for accounts that are themselves orchestrators. */
  pendingRewardCommission?: bigint;
  pendingFeeCommission?: bigint;
};

export type SeriesPoint = {
  round: number;
  ts: number;
  /** LPT */
  stake: number;
  /** LPT earned this round (all sources) */
  rewards: number;
  /**
   * The part of `rewards` that is reward-cut commission (orchestrators bonded
   * to themselves). It's income from other people's stake, so it is left out
   * of yield on the account's own stake.
   */
  commission: number;
  /** ETH earned this round */
  fees: number;
  /** % of network active stake */
  share: number | null;
  /**
   * Orchestrator this round's earnings came from (its reward call and
   * fees). Per account only; merged series leave it out.
   */
  from?: string;
};

export type AccountResult = {
  id: string;
  delegate: string | null;
  pendingStake: bigint;
  pendingFees: bigint;
  series: SeriesPoint[];
};

export type PortfolioResult = {
  accounts: AccountResult[];
  series: SeriesPoint[];
  pendingStake: bigint;
  pendingFees: bigint;
};

/** Pools for one orchestrator, sorted by round, with carry-forward lookup. */
export class PoolHistory {
  private rounds: number[];
  private byRound: Map<number, PoolPoint>;

  constructor(points: PoolPoint[]) {
    const sorted = [...points].sort((a, b) => a.round - b.round);
    this.rounds = sorted.map((p) => p.round);
    this.byRound = new Map(sorted.map((p) => [p.round, p]));
  }

  exact(round: number): PoolPoint | undefined {
    return this.byRound.get(round);
  }

  /** Latest pool at or before `round`; factors carry forward when absent. */
  at(round: number): PoolPoint | undefined {
    const rounds = this.rounds;
    let lo = 0;
    let hi = rounds.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (rounds[mid] <= round) {
        found = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return found < 0 ? undefined : this.byRound.get(rounds[found]);
  }

  latest(): PoolPoint | undefined {
    return this.byRound.get(this.rounds[this.rounds.length - 1]);
  }
}

const toFloat = (wei: bigint) => Number(wei) / 1e18;

type Holding = { shares: bigint; delegate: string | null };

/** Shares held at the end of each round, from ascending snapshots. */
function holdingsLookup(snapshots: Snapshot[]) {
  const sorted = [...snapshots].sort((a, b) => a.round - b.round);
  return (round: number): Holding | null => {
    let found: Holding | null = null;
    for (const s of sorted) {
      if (s.round <= round) found = { shares: s.shares, delegate: s.delegate };
      else break;
    }
    return found;
  };
}

export function computeAccount({
  account,
  snapshots,
  pools,
  rounds,
}: {
  account: AccountState;
  snapshots: Snapshot[];
  pools: Map<string, PoolHistory>;
  rounds: RoundPoint[];
}): AccountResult {
  const id = account.id.toLowerCase();
  const holdingAt = holdingsLookup(
    snapshots.filter((s) => s.account.toLowerCase() === id)
  );
  const claimRounds = new Set(
    snapshots.filter((s) => s.account.toLowerCase() === id).map((s) => s.round)
  );

  const crf = (d: string, r: number) => pools.get(d)?.at(r)?.crf ?? 0n;
  const cff = (d: string, r: number) => pools.get(d)?.at(r)?.cff ?? 0n;

  const series: SeriesPoint[] = [];
  let commission = 0n; // unclaimed reward commission (self-delegated only)

  const ordered = [...rounds].sort((a, b) => a.round - b.round);
  for (const { round: r, ts, totalActiveStake } of ordered) {
    const now = holdingAt(r);
    const prev = holdingAt(r - 1);

    let rewardWei = 0n;
    let cutWei = 0n;
    let feeWei = 0n;

    if (prev?.delegate && prev.shares > 0n) {
      const d = prev.delegate;
      const dCrf = crf(d, r) - crf(d, r - 1);
      const dCff = cff(d, r) - cff(d, r - 1);
      if (dCrf > 0n) rewardWei += (prev.shares * dCrf) / PRECISE;
      if (dCff > 0n) feeWei += (prev.shares * dCff) / PRECISE;
    }

    // Commission for an orchestrator bonded to itself.
    const selfDelegated = now?.delegate === id || prev?.delegate === id;
    if (claimRounds.has(r)) commission = 0n;
    if (selfDelegated) {
      const pool = pools.get(id)?.exact(r);
      if (pool?.rewardTokens && pool.rewardTokens > 0n) {
        const cut = (pool.rewardTokens * pool.rewardCut) / PPM;
        const toDelegators = pool.rewardTokens - cut;
        const onStaked =
          pool.totalStake > 0n
            ? (toDelegators * commission) / pool.totalStake
            : 0n;
        commission += cut + onStaked;
        rewardWei += cut + onStaked;
        cutWei += cut;
      }
      if (pool && pool.fees > 0n) {
        feeWei += (pool.fees * (PPM - pool.feeShare)) / PPM;
      }
    }

    let stakeWei = 0n;
    if (now?.delegate && now.shares > 0n) {
      stakeWei = (now.shares * crf(now.delegate, r)) / PRECISE;
    }
    if (now?.delegate === id) stakeWei += commission;

    if (stakeWei === 0n && rewardWei === 0n && series.length === 0) continue;

    const stake = toFloat(stakeWei);
    series.push({
      round: r,
      ts,
      stake,
      rewards: toFloat(rewardWei),
      commission: toFloat(cutWei),
      fees: toFloat(feeWei),
      share: totalActiveStake > 0 ? (stake / totalActiveStake) * 100 : null,
      from: prev?.delegate ?? (selfDelegated ? id : undefined),
    });
  }

  // Current position, from live entity state rather than the last snapshot.
  let pendingStake = 0n;
  let pendingFees = account.fees;
  const d = account.delegate?.toLowerCase() ?? null;
  const history = d ? pools.get(d) : undefined;
  if (d && history && account.shares > 0n) {
    const latest = history.latest();
    if (latest) {
      pendingStake = (account.shares * latest.crf) / PRECISE;
      const claimed = history.at(account.lastClaimRound)?.cff ?? 0n;
      const dCff = latest.cff - claimed;
      if (dCff > 0n) pendingFees += (account.shares * dCff) / PRECISE;
    }
  }
  if (d === id) {
    pendingStake += account.pendingRewardCommission ?? 0n;
    pendingFees += account.pendingFeeCommission ?? 0n;
  }

  return { id, delegate: d, pendingStake, pendingFees, series };
}

/** Sum per-account series on round; share is recomputed from summed stake. */
export function mergeSeries(
  perAccount: SeriesPoint[][],
  rounds: RoundPoint[]
): SeriesPoint[] {
  const tas = new Map(rounds.map((r) => [r.round, r.totalActiveStake]));
  const byRound = new Map<number, SeriesPoint>();
  for (const series of perAccount) {
    for (const p of series) {
      const acc = byRound.get(p.round);
      if (acc) {
        acc.stake += p.stake;
        acc.rewards += p.rewards;
        acc.commission += p.commission;
        acc.fees += p.fees;
      } else {
        byRound.set(p.round, { ...p, from: undefined });
      }
    }
  }
  return [...byRound.values()]
    .sort((a, b) => a.round - b.round)
    .map((p) => {
      const total = tas.get(p.round) ?? 0;
      return { ...p, share: total > 0 ? (p.stake / total) * 100 : null };
    });
}

export function computePortfolio(input: {
  accounts: AccountState[];
  snapshots: Snapshot[];
  pools: Map<string, PoolHistory>;
  rounds: RoundPoint[];
}): PortfolioResult {
  const accounts = input.accounts.map((account) =>
    computeAccount({ ...input, account })
  );
  return {
    accounts,
    series: mergeSeries(
      accounts.map((a) => a.series),
      input.rounds
    ),
    pendingStake: accounts.reduce((s, a) => s + a.pendingStake, 0n),
    pendingFees: accounts.reduce((s, a) => s + a.pendingFees, 0n),
  };
}

/* ── Derived metrics ─────────────────────────────────────────────────────── */

/** Median seconds per round from consecutive round start timestamps. */
export function averageRoundSeconds(rounds: RoundPoint[], sample = 30) {
  const sorted = [...rounds]
    .sort((a, b) => a.round - b.round)
    .slice(-sample - 1);
  const deltas: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].round !== sorted[i - 1].round + 1) continue;
    const dt = sorted[i].ts - sorted[i - 1].ts;
    if (dt > 0) deltas.push(dt);
  }
  if (!deltas.length) return 22.4 * 3600;
  deltas.sort((a, b) => a - b);
  const mid = deltas.length >> 1;
  return deltas.length % 2 ? deltas[mid] : (deltas[mid - 1] + deltas[mid]) / 2;
}

/**
 * Realised per-round growth over the trailing window: rewards the stake
 * earned divided by that stake. Commission is excluded — it comes from other
 * delegators' stake, and dividing it by an orchestrator's own (often tiny)
 * bond would report an absurd yield. Averaging over a window keeps one missed
 * reward call from swinging the yield to zero.
 */
export function trailingRoundRate(series: SeriesPoint[], window = 30) {
  if (series.length < 2) return 0;
  const tail = series.slice(-(window + 1));
  let rewards = 0;
  let stake = 0;
  for (let i = 1; i < tail.length; i++) {
    if (tail[i - 1].stake <= 0) continue;
    rewards += tail[i].rewards - tail[i].commission;
    stake += tail[i - 1].stake;
  }
  return stake > 0 ? Math.max(0, rewards / stake) : 0;
}

/** Average reward-cut commission per round over the trailing window. */
export function trailingCommission(series: SeriesPoint[], window = 30) {
  const tail = series.slice(-window);
  if (!tail.length) return 0;
  return tail.reduce((s, p) => s + p.commission, 0) / tail.length;
}

export function annualize(roundRate: number, roundSeconds: number) {
  if (roundRate <= 0 || roundSeconds <= 0) return 0;
  const roundsPerYear = (365 * 86400) / roundSeconds;
  return (Math.pow(1 + roundRate, roundsPerYear) - 1) * 100;
}

/**
 * Earnings over `days`: the stake compounds at the realised rate; commission
 * accrues flat, since it tracks delegators' stake rather than this account's.
 */
export function projectEarnings(
  stake: number,
  roundRate: number,
  days: number,
  roundSeconds: number,
  commissionPerRound = 0
) {
  if (roundSeconds <= 0) return 0;
  const n = (days * 86400) / roundSeconds;
  const compounded =
    stake > 0 && roundRate > 0 ? stake * (Math.pow(1 + roundRate, n) - 1) : 0;
  return compounded + Math.max(0, commissionPerRound) * n;
}

export function sumSince<K extends "rewards" | "fees">(
  series: SeriesPoint[],
  key: K,
  sinceTs: number
) {
  let total = 0;
  for (const p of series) if (p.ts >= sinceTs) total += p[key];
  return total;
}
