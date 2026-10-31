import { type ProposalAction, transferredLpt } from "./actions";

/**
 * OpenZeppelin Governor states, as `LivepeerGovernor.state()` returns them:
 * 0 Pending, 1 Active, 2 Canceled, 3 Defeated, 4 Succeeded, 5 Queued,
 * 6 Expired, 7 Executed.
 */
const PENDING = 0;
const ACTIVE = 1;
const DEFEATED = 3;
const EXECUTED = 7;
/** Passed the vote, whether or not it was then executed. */
const PASSED = new Set([4, 5, 6, 7]);

export type TreasuryStats = {
  /** LPT sent by executed proposals. */
  paidOut: number;
  /** Proposals that passed their vote. */
  passed: number;
  /** Proposals whose vote is over and decided (passed or defeated). */
  decided: number;
  /** LPT asked for by proposals still pending or being voted on. */
  upForVote: number;
};

/**
 * The treasury's record from its proposals and their on-chain states:
 * what it has paid out, how often proposals pass, and what's being asked
 * for right now. A proposal whose state hasn't loaded is left out, and
 * canceled ones count toward nothing.
 */
export function treasuryStats(
  proposals: readonly {
    actions: readonly ProposalAction[];
    state: number | undefined;
  }[]
): TreasuryStats {
  const stats: TreasuryStats = {
    paidOut: 0,
    passed: 0,
    decided: 0,
    upForVote: 0,
  };
  for (const { actions, state } of proposals) {
    if (state == null) continue;
    // Every LPT transfer counts, even in a proposal that also makes
    // other calls: it's still LPT leaving (or asked of) the treasury.
    const amount = transferredLpt(actions);
    if (state === EXECUTED) stats.paidOut += amount;
    if (PASSED.has(state)) {
      stats.passed += 1;
      stats.decided += 1;
    } else if (state === DEFEATED) {
      stats.decided += 1;
    } else if (state === PENDING || state === ACTIVE) {
      stats.upForVote += amount;
    }
  }
  return stats;
}
