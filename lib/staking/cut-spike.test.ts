import { type CutChange, findCutSpike, SPIKE_POINTS } from "./cut-spike";

// Ported from the previous explorer's useOrchestratorRewardCutSpike tests.
const NOW = Date.UTC(2026, 0, 1) / 1000;
const change = (daysAgo: number, rewardCut: number): CutChange => ({
  timestamp: NOW - daysAgo * 86_400,
  rewardCut,
});

describe("findCutSpike", () => {
  it("needs at least two changes", () => {
    expect(findCutSpike([], NOW)).toBeNull();
    expect(findCutSpike([change(10, 50)], NOW)).toBeNull();
  });

  it("fires on a single 80-point jump", () => {
    expect(findCutSpike([change(10, 0), change(5, 80)], NOW)).toMatchObject({
      from: 0,
      to: 80,
    });
  });

  it("fires on a climb in steps within the window", () => {
    expect(
      findCutSpike(
        [
          change(10, 0),
          change(9, 25),
          change(8, 50),
          change(7, 75),
          change(5, 100),
        ],
        NOW
      )
    ).toMatchObject({ from: 0, to: 100 });
  });

  it("fires on a dip and then a spike within the window", () => {
    expect(
      findCutSpike([change(30, 100), change(5, 0), change(2, 100)], NOW)
    ).toMatchObject({ from: 0, to: 100 });
  });

  it("fires at exactly the threshold, not just below it", () => {
    expect(
      findCutSpike([change(10, 0), change(5, SPIKE_POINTS)], NOW)
    ).not.toBeNull();
    expect(
      findCutSpike([change(10, 0), change(5, SPIKE_POINTS - 1)], NOW)
    ).toBeNull();
  });

  it("ignores cuts going down", () => {
    expect(findCutSpike([change(10, 100), change(5, 50)], NOW)).toBeNull();
  });

  it("ignores a spike older than 180 days", () => {
    expect(findCutSpike([change(200, 0), change(190, 100)], NOW)).toBeNull();
  });

  it("ignores a rise spread over more than the window", () => {
    expect(
      findCutSpike([change(40, 0), change(30, 50), change(20, 100)], NOW)
    ).toBeNull();
  });
});
