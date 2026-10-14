import { type Day, fillUnsetDayStats } from "./network";

const day = (date: number, over: Partial<Day> = {}): Day => ({
  date,
  volumeETH: 1,
  volumeUSD: 2000,
  participationRate: 48,
  inflation: 0.0005,
  totalActiveStake: 18_000_000,
  delegatorsCount: 2000,
  activeTranscoderCount: 100,
  ...over,
});

describe("fillUnsetDayStats", () => {
  it("carries snapshot fields forward over a day that hasn't been filled in", () => {
    const [, today] = fillUnsetDayStats([
      day(1),
      day(2, {
        volumeETH: 0.4,
        participationRate: 0,
        inflation: 0,
        totalActiveStake: 0,
        delegatorsCount: 0,
        activeTranscoderCount: 0,
      }),
    ]);
    expect(today.inflation).toBe(0.0005);
    expect(today.participationRate).toBe(48);
    expect(today.totalActiveStake).toBe(18_000_000);
    expect(today.delegatorsCount).toBe(2000);
    expect(today.activeTranscoderCount).toBe(100);
    // Fee volume is real data even when small or zero.
    expect(today.volumeETH).toBe(0.4);
  });

  it("keeps a day with no fees at zero", () => {
    const [, d] = fillUnsetDayStats([
      day(1),
      day(2, { volumeETH: 0, volumeUSD: 0 }),
    ]);
    expect(d.volumeETH).toBe(0);
    expect(d.volumeUSD).toBe(0);
  });

  it("carries across several unset days in a row", () => {
    const out = fillUnsetDayStats([
      day(1),
      day(2, { inflation: 0 }),
      day(3, { inflation: 0 }),
    ]);
    expect(out.map((d) => d.inflation)).toEqual([0.0005, 0.0005, 0.0005]);
  });

  it("leaves real values untouched", () => {
    const out = fillUnsetDayStats([day(1), day(2, { inflation: 0.0004 })]);
    expect(out[1].inflation).toBe(0.0004);
  });
});
