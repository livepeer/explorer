import {
  type CutEvent,
  findRecentRewardCutSpike,
  REWARD_CUT_SPIKE_PP,
} from "./useOrchestratorRewardCutSpike";

const NOW_MS = Date.UTC(2026, 0, 1);
const NOW_SEC = Math.floor(NOW_MS / 1000);
const SEC_PER_DAY = 86_400;
const MS_PER_DAY = 86_400_000;

const event = (daysAgo: number, rewardCutPct: number): CutEvent => ({
  timestamp: NOW_SEC - daysAgo * SEC_PER_DAY,
  rewardCut: String(Math.round(rewardCutPct * 10_000)),
});

const opts = { now: NOW_MS };

describe("findRecentRewardCutSpike", () => {
  it("returns null for empty input", () => {
    expect(findRecentRewardCutSpike([], opts)).toBeNull();
  });

  it("returns null for a single event", () => {
    expect(findRecentRewardCutSpike([event(10, 50)], opts)).toBeNull();
  });

  it("fires on a single-event 80pp jump", () => {
    const spike = findRecentRewardCutSpike([event(10, 0), event(5, 80)], opts);
    expect(spike?.fromRewardCut).toBe(0);
    expect(spike?.toRewardCut).toBe(0.8);
  });

  it("fires on a 4x25pp climb spread over 6 days", () => {
    const spike = findRecentRewardCutSpike(
      [event(10, 0), event(9, 25), event(8, 50), event(7, 75), event(5, 100)],
      opts
    );
    expect(spike?.fromRewardCut).toBe(0);
    expect(spike?.toRewardCut).toBe(1);
  });

  it("fires on a dip-then-spike within 7 days", () => {
    const spike = findRecentRewardCutSpike(
      [event(30, 100), event(5, 0), event(2, 100)],
      opts
    );
    expect(spike?.fromRewardCut).toBe(0);
    expect(spike?.toRewardCut).toBe(1);
  });

  it("fires at exactly the spike threshold", () => {
    expect(
      findRecentRewardCutSpike(
        [event(10, 0), event(5, REWARD_CUT_SPIKE_PP * 100)],
        opts
      )
    ).not.toBeNull();
  });

  it("does not fire just below the spike threshold", () => {
    expect(
      findRecentRewardCutSpike(
        [event(10, 0), event(5, REWARD_CUT_SPIKE_PP * 100 - 1)],
        opts
      )
    ).toBeNull();
  });

  it("does not fire on downward-only changes", () => {
    expect(
      findRecentRewardCutSpike([event(10, 100), event(5, 50)], opts)
    ).toBeNull();
  });

  it("does not fire on spikes outside the 180-day cutoff", () => {
    expect(
      findRecentRewardCutSpike([event(200, 0), event(190, 100)], opts)
    ).toBeNull();
  });

  it("returns the most recent qualifying spike", () => {
    const spike = findRecentRewardCutSpike(
      [event(150, 0), event(145, 100), event(50, 0), event(45, 100)],
      opts
    );
    expect(spike?.endTimestamp).toBe(NOW_MS - 45 * MS_PER_DAY);
  });
});
