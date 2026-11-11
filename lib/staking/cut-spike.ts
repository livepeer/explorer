/**
 * A sharp rise in an orchestrator's reward cut, to warn about before
 * delegating (#682): an orchestrator can lift its cut toward 100% right
 * after attracting stake, keeping its delegators' rewards. Ported from the
 * previous explorer's useOrchestratorRewardCutSpike, with its thresholds.
 */

/** The smallest rise (percentage points) within a window that counts. */
export const SPIKE_POINTS = 80;
/** The window a rise is measured over, in days. */
export const WINDOW_DAYS = 7;
/** How long ago a spike still warns, in days. */
export const RECENT_DAYS = 180;

const DAY = 86_400;

/** A cut change: unix seconds, and the reward cut it set (%). */
export type CutChange = { timestamp: number; rewardCut: number };

export type CutSpike = {
  /** When the rise completed, unix seconds. */
  at: number;
  /** The lowest cut in the window, and where it ended (%). */
  from: number;
  to: number;
};

/**
 * The most recent rise of SPIKE_POINTS or more within any WINDOW_DAYS-day
 * window in the last RECENT_DAYS days, or null. Only rises count.
 */
export function findCutSpike(
  changes: readonly CutChange[],
  nowSec = Date.now() / 1000
): CutSpike | null {
  if (changes.length < 2) return null;
  const cutoff = nowSec - RECENT_DAYS * DAY;
  const desc = [...changes].sort((a, b) => b.timestamp - a.timestamp);
  for (let i = 0; i < desc.length - 1; i++) {
    const end = desc[i];
    // Newer first: past the cutoff, everything after is older still.
    if (end.timestamp < cutoff) break;
    const windowStart = end.timestamp - WINDOW_DAYS * DAY;
    // The lowest cut in force during the window: older changes count until
    // the first one at or before the window opened, which was in force then.
    let lowest = Infinity;
    for (let j = i + 1; j < desc.length; j++) {
      lowest = Math.min(lowest, desc[j].rewardCut);
      if (desc[j].timestamp <= windowStart) break;
    }
    if (end.rewardCut - lowest >= SPIKE_POINTS) {
      return { at: end.timestamp, from: lowest, to: end.rewardCut };
    }
  }
  return null;
}
