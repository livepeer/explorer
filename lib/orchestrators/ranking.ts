import type { Orchestrator } from "@/lib/subgraph/network";

/**
 * The orchestrator list's default order: what a delegator joining now can
 * expect to earn, rather than size, so new stake isn't steered to whoever
 * already has the most.
 */

/** Rounds of the 30-round window an orchestrator needs before it's ranked. */
export const MIN_HISTORY = 15;
/** Yields this close, in percentage points, count as a tie. */
export const TIE_PP = 0.1;

type Rankable = Pick<
  Orchestrator,
  "forwardApr" | "historyRounds" | "totalStake"
> & {
  /** Fee yield, annualised %, when prices are known. */
  feeApr?: number | null;
};

/**
 * Fees delegators can expect, as an annualised % of stake: the last 90 days'
 * fees at today's fee share, less what the orchestrator paid itself, valued
 * in LPT at today's ETH/LPT price. Fees don't compound into stake, so it's
 * a simple rate.
 */
export function feeApr(
  o: Pick<
    Orchestrator,
    "ninetyDayVolumeETH" | "selfPaidFees90" | "feeShare" | "totalStake"
  >,
  /** LPT one ETH buys today */
  lptPerEth: number
) {
  if (o.totalStake <= 0) return 0;
  const fees = Math.max(0, o.ninetyDayVolumeETH - o.selfPaidFees90);
  const toDelegators = fees * (o.feeShare / 100) * lptPerEth;
  return (toDelegators / o.totalStake) * (365 / 90) * 100;
}

/** Rewards at today's cut plus fees: what the list ranks on. */
export const expectedApr = (o: Rankable) =>
  o.forwardApr == null ? null : o.forwardApr + (o.feeApr ?? 0);

/** Enough of a track record to rank on. */
export const hasHistory = (o: Rankable) =>
  o.forwardApr != null && o.historyRounds >= MIN_HISTORY;

const bucket = (o: Rankable) => Math.round((expectedApr(o) ?? 0) / TIE_PP);

/**
 * Best expected yield first. Near-ties go to the smaller orchestrator, so a
 * tie never falls back to ranking by size.
 */
export const byForwardYield = (a: Rankable, b: Rankable) =>
  bucket(b) - bucket(a) || a.totalStake - b.totalStake;

/**
 * Ranked orchestrators, best first, and the ones too new to rank, kept
 * apart rather than sunk to the bottom.
 */
export function rankByYield<T extends Rankable>(list: T[]) {
  return {
    ranked: list.filter(hasHistory).sort(byForwardYield),
    fresh: list
      .filter((o) => !hasHistory(o))
      .sort((a, b) => b.totalStake - a.totalStake),
  };
}
