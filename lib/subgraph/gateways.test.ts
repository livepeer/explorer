import {
  dailyFees,
  depositRunway,
  type Gateway,
  summarizePayouts,
} from "./gateways";

const DAY = 86400;

const gateway = (over: Partial<Gateway> = {}): Gateway => ({
  id: "0xgw",
  deposit: 3,
  reserve: 1,
  thirtyDayVolumeETH: 3,
  ninetyDayVolumeETH: 9,
  totalVolumeETH: 40,
  firstActiveDay: 0,
  lastActiveDay: 0,
  days: [],
  ...over,
});

const ticket = (id: string, to: string, fee: number, ts = 100) => ({
  id,
  timestamp: ts,
  faceValue: String(fee),
  recipient: { id: to },
});

describe("summarizePayouts", () => {
  it("groups tickets by orchestrator, largest first", () => {
    const p = summarizePayouts("0xgw", 0, [
      ticket("1", "0xa", 0.1, 10),
      ticket("2", "0xb", 0.5, 20),
      ticket("3", "0xa", 0.2, 30),
    ]);
    expect(p.total).toBeCloseTo(0.8);
    expect(p.recipients.map((r) => r.id)).toEqual(["0xb", "0xa"]);
    expect(p.recipients[1]).toMatchObject({ tickets: 2, lastPaid: 30 });
    expect(p.recipients[1].fees).toBeCloseTo(0.3);
    expect(p.selfShare).toBe(0);
  });

  it("measures how much the gateway paid its own orchestrator", () => {
    const p = summarizePayouts("0xgw", 0, [
      ticket("1", "0xgw", 0.3),
      ticket("2", "0xa", 0.1),
    ]);
    expect(p.recipients[0]).toMatchObject({ id: "0xgw", self: true });
    expect(p.selfShare).toBeCloseTo(0.75);
  });

  it("handles a gateway that paid nothing", () => {
    const p = summarizePayouts("0xgw", 0, []);
    expect(p).toMatchObject({ total: 0, recipients: [], selfShare: 0 });
  });
});

describe("dailyFees", () => {
  it("fills days without fees with zero, oldest first", () => {
    const now = 10 * DAY + 3600;
    const out = dailyFees(
      [
        { date: 8 * DAY, volumeETH: 0.2 },
        { date: 10 * DAY, volumeETH: 0.5 },
      ],
      4,
      now
    );
    expect(out).toEqual([
      { date: 7 * DAY, volumeETH: 0 },
      { date: 8 * DAY, volumeETH: 0.2 },
      { date: 9 * DAY, volumeETH: 0 },
      { date: 10 * DAY, volumeETH: 0.5 },
    ]);
  });
});

describe("depositRunway", () => {
  it("divides the deposit by the last 30 days' daily pace", () => {
    expect(depositRunway(gateway({ deposit: 3, thirtyDayVolumeETH: 3 }))).toBe(
      30
    );
  });

  it("is null without recent spend", () => {
    expect(depositRunway(gateway({ thirtyDayVolumeETH: 0 }))).toBeNull();
  });
});
