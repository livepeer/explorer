import type { SeriesPoint } from "./compute";
import { flowsByRound, supplyShareSeries, valueSeries } from "./value";

/** A series from [stake, rewards] per round, starting at round 1. */
const series = (rows: [number, number][], fees: number[] = []) =>
  rows.map(
    ([stake, rewards], i): SeriesPoint => ({
      round: i + 1,
      ts: 1_700_000_000 + i * 86_400,
      stake,
      rewards,
      commission: 0,
      fees: fees[i] ?? 0,
      feeCommission: 0,
      share: null,
    })
  );

const flows = (s: SeriesPoint[]) =>
  [...flowsByRound([{ id: "a", series: s }]).values()].map((f) => [
    f.deposited,
    f.withdrawn,
  ]);

describe("flowsByRound", () => {
  it("counts the first stake as a deposit and rewards as neither", () => {
    expect(
      flows(
        series([
          [100, 0],
          [101, 1],
          [102, 1],
        ])
      )
    ).toEqual([
      [100, 0],
      [100, 0],
      [100, 0],
    ]);
  });

  it("adds later deposits and withdrawals to running totals", () => {
    expect(
      flows(
        series([
          [100, 0],
          [160, 10], // bonded 50
          [60, 0], // unbonded 100
          [60, 0],
        ])
      )
    ).toEqual([
      [100, 0],
      [150, 0],
      [150, 100],
      [150, 100],
    ]);
  });

  it("counts a round's earnings before a withdrawal in it", () => {
    // Stake 100 earns 100 in round 2, and 100 is unbonded the same round.
    expect(
      flows(
        series([
          [100, 0],
          [100, 100],
        ])
      )
    ).toEqual([
      [100, 0],
      [100, 100],
    ]);
  });

  it("takes a deposit after a withdrawal as that LPT coming back", () => {
    expect(
      flows(
        series([
          [100, 0],
          [40, 0], // unbonded 60
          [140, 0], // bonded 100: the 60 back, then 40 new
        ])
      )
    ).toEqual([
      [100, 0],
      [100, 60],
      [140, 0],
    ]);
  });

  it("matches a withdrawal from one wallet with a deposit into another", () => {
    // A unbonds 100; B, also in the portfolio, bonds 100 later.
    const a = series([
      [100, 0],
      [0, 0],
      [0, 0],
    ]);
    const b = series([[100, 0]]).map((p) => ({ ...p, round: 3 }));
    const m = flowsByRound([
      { id: "a", series: a },
      { id: "b", series: b },
    ]);
    expect([...m.values()].pop()).toEqual({ deposited: 100, withdrawn: 0 });
  });

  it("ignores rounding-sized flows", () => {
    expect(
      flows(
        series([
          [100, 0],
          [101.0000000001, 1],
        ])
      )
    ).toEqual([
      [100, 0],
      [100, 0],
    ]);
  });

  it("sums accounts, each from its own first round", () => {
    const a = series([
      [100, 0],
      [110, 10],
    ]);
    const b = series([[50, 0]]).map((p) => ({ ...p, round: 2 }));
    const m = flowsByRound([
      { id: "a", series: a },
      { id: "b", series: b },
    ]);
    expect([...m.values()].map((f) => f.deposited)).toEqual([100, 150]);
  });

  describe("transfers between the portfolio's own wallets", () => {
    // A: 100 in, grows to 200; in round 3 moves 100 to B.
    const a = series([
      [100, 0],
      [200, 100],
      [100, 0],
    ]);
    const b = series([[100, 0]]).map((p) => ({ ...p, round: 3 }));
    const move = [{ round: 3, from: "a", to: "b", amount: 100 }];

    it("are neither a deposit nor a withdrawal", () => {
      const m = flowsByRound(
        [
          { id: "a", series: a },
          { id: "b", series: b },
        ],
        move
      );
      expect([...m.values()].pop()).toEqual({ deposited: 100, withdrawn: 0 });
    });

    it("are a deposit when only the receiver is here", () => {
      const m = flowsByRound([{ id: "b", series: b }], move);
      expect([...m.values()].pop()).toEqual({ deposited: 100, withdrawn: 0 });
    });

    it("are a withdrawal when only the sender is here", () => {
      const m = flowsByRound([{ id: "a", series: a }], move);
      expect([...m.values()].pop()).toEqual({
        deposited: 100,
        withdrawn: 100,
      });
    });

    it("match addresses regardless of case", () => {
      const m = flowsByRound(
        [
          { id: "0xAA", series: a },
          { id: "0xbb", series: b },
        ],
        [{ round: 3, from: "0xaa", to: "0xBB", amount: 100 }]
      );
      expect([...m.values()].pop()).toEqual({ deposited: 100, withdrawn: 0 });
    });
  });
});

describe("valueSeries", () => {
  const value = (
    s: SeriesPoint[],
    lpt: (number | null)[],
    eth: (number | null)[] = lpt.map(() => null)
  ) =>
    valueSeries(s, flowsByRound([{ id: "a", series: s }]), { lpt, eth }).map(
      (p) => [p.withStaking, p.withoutStaking]
    );

  it("prices staked and deposited LPT at each round's price", () => {
    expect(
      value(
        series([
          [100, 0],
          [110, 10],
        ]),
        [5, 4]
      )
    ).toEqual([
      [500, 500],
      [440, 400],
    ]);
  });

  it("keeps withdrawn LPT, valued at each later price", () => {
    // 100 in at $1, grows to 200, half unbonded at $2, then the price
    // falls to $1: the withdrawal falls with it, as if kept.
    expect(
      value(
        series([
          [100, 0],
          [200, 100],
          [100, 0],
          [100, 0],
        ]),
        [1, 2, 2, 1]
      )
    ).toEqual([
      [100, 100],
      [400, 200],
      [400, 200],
      [200, 100],
    ]);
  });

  it("shows an orchestrator that unbonds its rewards as earning them", () => {
    // 10 bonded; 100 earned and unbonded every round, at $1.
    const v = value(
      series([
        [10, 0],
        [10, 100],
        [10, 100],
      ]),
      [1, 1, 1]
    );
    expect(v[v.length - 1]).toEqual([210, 10]);
  });

  it("values fees held as ETH at each round's ETH price", () => {
    expect(
      value(
        series(
          [
            [100, 0],
            [100, 0],
          ],
          [1, 0]
        ),
        [1, 1],
        [1000, 2000]
      )
    ).toEqual([
      [1100, 100],
      [2100, 100],
    ]);
  });

  it("uses the last known ETH price when a round has none", () => {
    expect(
      value(
        series(
          [
            [100, 0],
            [100, 0],
          ],
          [1, 0]
        ),
        [1, 1],
        [1000, null]
      )[1]
    ).toEqual([1100, 100]);
  });

  it("skips rounds with no LPT price", () => {
    const s = series([
      [100, 0],
      [100, 0],
    ]);
    const v = valueSeries(s, flowsByRound([{ id: "a", series: s }]), {
      lpt: [null, 2],
      eth: [null, null],
    });
    expect(v.map((p) => p.round)).toEqual([2]);
  });
});

describe("supplyShareSeries", () => {
  const withSupply = (s: SeriesPoint[], supply: (number | undefined)[]) =>
    s.map((p, i) => ({ ...p, supply: supply[i], share: 1 }));
  const run = (s: SeriesPoint[]) =>
    supplyShareSeries(s, flowsByRound([{ id: "a", series: s }]));

  it("keeps pace with inflation when staked, and falls behind when not", () => {
    // Supply grows 10% a round; the stake earns the same 10%.
    const s = withSupply(
      series([
        [100, 0],
        [110, 10],
        [121, 11],
      ]),
      [1000, 1100, 1210]
    );
    const out = run(s);
    expect(out.map((p) => p.withStaking)).toEqual([10, 10, 10]);
    expect(out[2].withoutStaking).toBeCloseTo((100 / 1210) * 100);
    expect(out[2]).toMatchObject({ withLpt: 121, withoutLpt: 100 });
  });

  it("counts LPT taken out as kept", () => {
    const s = withSupply(
      series([
        [100, 0],
        [40, 0],
      ]),
      [1000, 1000]
    );
    expect(run(s)[1]).toMatchObject({ withLpt: 100, withStaking: 10 });
  });

  it("leaves out rounds whose supply is incomplete", () => {
    // Half the supply until round 3, as on Arbitrum before the bridge.
    const s = withSupply(
      series([
        [100, 0],
        [100, 0],
        [100, 0],
        [100, 0],
      ]),
      [500, 501, 1000, 1001]
    );
    expect(run(s).map((p) => p.round)).toEqual([3, 4]);
  });

  it("leaves out rounds without a known supply", () => {
    const s = withSupply(
      series([
        [100, 0],
        [101, 1],
      ]),
      [undefined, 1000]
    );
    expect(run(s).map((p) => p.round)).toEqual([2]);
  });
});
