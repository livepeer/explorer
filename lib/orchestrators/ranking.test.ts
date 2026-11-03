import { rewardStats, selfPaid } from "@/lib/subgraph/network";

import { feeApr, MIN_HISTORY, rankByYield } from "./ranking";

const ROUND_SECONDS = 86400;
const CUR = 1000;
const GROSS = 0.0004; // reward per LPT per round, before the cut

/** A window of pools where `cutAt(round)` is the cut (%) in force. */
function pools(cutAt: (round: number) => number, rounds = 30) {
  let crf = 10n ** 27n;
  const out: Parameters<typeof rewardStats>[0] = [];
  for (let r = CUR - rounds; r < CUR; r++) {
    const cut = cutAt(r);
    const perRound = GROSS * (1 - cut / 100);
    crf += (crf * BigInt(Math.round(perRound * 1e12))) / 10n ** 12n;
    out.push({
      round: { id: String(r) },
      rewardTokens: "1",
      rewardCut: String(cut * 1e4),
      cumulativeRewardFactor: crf.toString(),
    });
  }
  return out;
}

const stats = (cutAt: (r: number) => number, cutNow: number, rounds = 30) =>
  rewardStats(pools(cutAt, rounds), CUR, ROUND_SECONDS, cutNow);

describe("rewardStats", () => {
  it("expects what it realised when the cut held steady", () => {
    const s = stats(() => 10, 10);
    expect(s.forwardApr).toBeCloseTo(s.realizedApr!, 6);
    expect(s.cutRaisedFrom).toBeNull();
    expect(s.historyRounds).toBe(30);
  });

  it("expects less than it realised after a cut raise", () => {
    const s = stats((r) => (r < CUR - 5 ? 5 : 50), 50);
    expect(s.cutRaisedFrom).toBe(5);
    expect(s.forwardApr!).toBeLessThan(s.realizedApr! * 0.6);
    // Close to what a steady 50% cut would have paid.
    expect(s.forwardApr!).toBeCloseTo(stats(() => 50, 50).realizedApr!, 0);
  });

  it("doesn't credit a lowered cut before it has paid out", () => {
    const s = stats((r) => (r < CUR - 5 ? 50 : 5), 5);
    expect(s.forwardApr).toBeCloseTo(s.realizedApr!, 6);
    expect(s.cutRaisedFrom).toBeNull();
  });

  it("expects nothing from a 100% cut", () => {
    const s = stats(() => 100, 100);
    expect(s.realizedApr).toBe(0);
    expect(s.forwardApr).toBe(0);
  });

  it("counts the rounds it has been active", () => {
    expect(stats(() => 10, 10, 8).historyRounds).toBe(8);
  });
});

describe("rankByYield", () => {
  const o = (
    id: string,
    forwardApr: number | null,
    totalStake: number,
    historyRounds = 30
  ) => ({
    id,
    forwardApr,
    totalStake,
    historyRounds,
  });

  it("puts the best expected yield first", () => {
    const { ranked } = rankByYield([
      o("a", 10, 1),
      o("b", 12, 1),
      o("c", 11, 1),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks near-ties toward the smaller orchestrator", () => {
    const { ranked } = rankByYield([
      o("big", 12.02, 900_000),
      o("small", 12.0, 40_000),
      o("lower", 11.5, 10_000),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["small", "big", "lower"]);
  });

  it("keeps orchestrators without enough history apart", () => {
    const { ranked, fresh } = rankByYield([
      o("old", 10, 1),
      o("new", 30, 5, MIN_HISTORY - 1),
      o("unknown", null, 9),
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["old"]);
    expect(fresh.map((x) => x.id)).toEqual(["unknown", "new"]);
  });
});

describe("feeApr", () => {
  const base = {
    ninetyDayVolumeETH: 9,
    selfPaidFees90: 0,
    feeShare: 50,
    totalStake: 100_000,
  };

  it("annualises delegators' share of 90 days of fees, in LPT", () => {
    // 9 ETH × 50% × 500 LPT/ETH = 2,250 LPT in 90 days on 100k stake.
    expect(feeApr(base, 500)).toBeCloseTo(2.25 * (365 / 90), 6);
  });

  it("leaves out fees it paid itself", () => {
    expect(feeApr({ ...base, selfPaidFees90: 6 }, 500)).toBeCloseTo(
      feeApr({ ...base, ninetyDayVolumeETH: 3 }, 500),
      9
    );
  });

  it("lets fees separate orchestrators tied on rewards", () => {
    const { ranked } = rankByYield([
      {
        id: "idle",
        forwardApr: 30,
        feeApr: 0,
        totalStake: 1,
        historyRounds: 30,
      },
      {
        id: "busy",
        forwardApr: 30,
        feeApr: 1.2,
        totalStake: 9,
        historyRounds: 30,
      },
    ]);
    expect(ranked.map((x) => x.id)).toEqual(["busy", "idle"]);
  });
});

describe("selfPaid", () => {
  it("totals only tickets an address sent to itself", () => {
    const t = (id: string, from: string, to: string, eth: string) => ({
      id,
      faceValue: eth,
      sender: { id: from },
      recipient: { id: to },
    });
    const out = selfPaid([
      t("1", "0xa", "0xa", "1.5"),
      t("2", "0xa", "0xb", "4"),
      t("3", "0xa", "0xa", "0.5"),
    ]);
    expect(out.get("0xa")).toBe(2);
    expect(out.has("0xb")).toBe(false);
  });
});
