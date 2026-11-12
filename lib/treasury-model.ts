/** The treasury as the API reports it (see lib/treasury.ts). */
export type TreasuryState = {
  /** LPT in the treasury now. */
  balance: number;
  /** The balance at which the cut switches off. */
  ceiling: number;
  /** Share of each round's minted rewards paid in, 0 to 1. */
  cut: number;
  /** The cut from next round. */
  nextCut: number;
  /** Balance over time, oldest first (unix seconds, LPT). */
  history: { ts: number; value: number }[];
};

/**
 * Where the balance is heading: LPT paid in per round, and when it reaches
 * the ceiling at that pace. The per-round figure is the cut of the network's
 * recent mintable rewards, so it assumes every orchestrator calls reward and
 * no proposal spends in the meantime: an upper bound on the pace.
 */
export function treasuryPace(
  t: Pick<TreasuryState, "balance" | "ceiling" | "nextCut">,
  mintablePerRound: number,
  roundSeconds: number,
  nowSec: number
) {
  const perRound = mintablePerRound * t.nextCut;
  const remaining = Math.max(0, t.ceiling - t.balance);
  if (remaining === 0) return { perRound, full: true as const };
  if (perRound <= 0) return { perRound: 0, full: false as const, rounds: null };
  const rounds = Math.ceil(remaining / perRound);
  return {
    perRound,
    full: false as const,
    rounds,
    fullAt: nowSec + rounds * roundSeconds,
  };
}
