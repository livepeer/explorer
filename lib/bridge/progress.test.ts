import {
  depositTiming,
  waitText,
  withdrawalDay,
  withdrawalProgress,
} from "@/lib/bridge/progress";
import type { BridgeWithdrawal } from "@/lib/bridge/types";

describe("waitText", () => {
  it("rounds to the largest sensible unit", () => {
    expect(waitText(4 * 86_400 + 3600)).toBe("~4 days");
    expect(waitText(86_400)).toBe("~1 day");
    expect(waitText(5 * 3600)).toBe("~5 hours");
    expect(waitText(20 * 60)).toBe("~20 min");
    expect(waitText(0)).toBe("a moment");
  });
});

describe("deposit timing", () => {
  it("counts down and never shows done before it arrives", () => {
    expect(depositTiming(0, 4 * 60)).toEqual({
      minutesLeft: 11,
      progress: 4 / 15,
    });
    expect(depositTiming(0, 20 * 60)).toEqual({
      minutesLeft: 0,
      progress: 0.95,
    });
  });
});

const DAY = 86_400;
const w = (over: Partial<BridgeWithdrawal>): BridgeWithdrawal => ({
  id: "1",
  from: "0xa",
  to: "0xa",
  amount: "1",
  block: "1",
  timestamp: 0,
  tx: "0x1",
  status: "waiting",
  readyAt: 7 * DAY,
  ...over,
});

describe("withdrawal progress", () => {
  it("runs from sent to claimable", () => {
    expect(withdrawalProgress(w({}), 0)).toBe(0);
    expect(withdrawalProgress(w({}), 3.5 * DAY)).toBe(0.5);
    expect(withdrawalProgress(w({}), 9 * DAY)).toBe(1);
  });

  it("is full once ready", () => {
    expect(withdrawalProgress(w({ status: "ready", readyAt: null }), 0)).toBe(
      1
    );
  });

  it("counts whole days of the period", () => {
    expect(withdrawalDay(w({}), 60)).toBe("day 1 of 7");
    expect(withdrawalDay(w({}), 1.5 * DAY)).toBe("day 2 of 7");
    expect(withdrawalDay(w({}), 20 * DAY)).toBe("day 7 of 7");
  });
});
