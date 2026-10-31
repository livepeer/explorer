import {
  annualize,
  annualizeFees,
  averageRoundSeconds,
  averageStakeSince,
  computeAccount,
  computePortfolio,
  PoolHistory,
  type PoolPoint,
  PRECISE,
  projectEarnings,
  type RoundPoint,
  trailingCommission,
  trailingFeeRate,
  trailingRoundRate,
} from "./compute";

const E18 = 10n ** 18n;
const lpt = (n: number) => BigInt(Math.round(n * 1e6)) * 10n ** 12n;
/** CRF as a decimal multiple of PRECISE, e.g. 1.01 → 1.01e27 */
const factor = (n: number) =>
  (BigInt(Math.round(n * 1e9)) * PRECISE) / 10n ** 9n;

const pool = (round: number, crf: number, extra: Partial<PoolPoint> = {}) => ({
  round,
  crf: factor(crf),
  cff: 0n,
  rewardTokens: null,
  rewardCut: 0n,
  feeShare: 1_000_000n,
  totalStake: 0n,
  fees: 0n,
  ...extra,
});

const rounds = (from: number, to: number, tas = 1000): RoundPoint[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    round: from + i,
    ts: 1_700_000_000 + (from + i) * 80_000,
    totalActiveStake: tas,
  }));

const D = "0xorch-d";
const E = "0xorch-e";
const A = "0xalice";

describe("computeAccount", () => {
  it("reconstructs stake and rewards from CRF growth", () => {
    const pools = new Map([
      [
        D,
        new PoolHistory([
          pool(10, 1),
          pool(11, 1.01),
          pool(12, 1.01),
          pool(13, 1.0201),
        ]),
      ],
    ]);
    const result = computeAccount({
      account: {
        id: A,
        delegate: D,
        shares: lpt(100),
        fees: 0n,
        lastClaimRound: 10,
      },
      snapshots: [{ account: A, delegate: D, round: 10, shares: lpt(100) }],
      pools,
      rounds: rounds(8, 13),
    });

    expect(result.series.map((p) => p.round)).toEqual([10, 11, 12, 13]);
    expect(result.series.map((p) => p.stake)).toEqual([100, 101, 101, 102.01]);
    // Round 12's reward wasn't called: zero, not a gap.
    expect(result.series.map((p) => +p.rewards.toFixed(6))).toEqual([
      0, 1, 0, 1.01,
    ]);
    expect(result.series[3].share).toBeCloseTo(10.201, 6);
    expect(result.pendingStake).toBe(lpt(102.01));
  });

  it("counts only the growth in an orchestrator's first active round as reward", () => {
    // Bonded in round 4000 to an orchestrator whose first pool is 4001.
    const pools = new Map([[D, new PoolHistory([pool(4001, 1.0003)])]]);
    const result = computeAccount({
      account: {
        id: A,
        delegate: D,
        shares: lpt(10_000),
        fees: 0n,
        lastClaimRound: 4000,
      },
      snapshots: [
        { account: A, delegate: D, round: 4000, shares: lpt(10_000) },
      ],
      pools,
      rounds: rounds(4000, 4001),
    });
    const last = result.series[result.series.length - 1];
    expect(+last.stake.toFixed(6)).toBe(10_003);
    expect(+last.rewards.toFixed(6)).toBe(3);
    // Before the first pool, the stake is the shares, not 0.
    expect(result.series[0].stake).toBe(10_000);
  });

  it("shows the stake of a wallet delegated to an orchestrator that's never been active", () => {
    const result = computeAccount({
      account: {
        id: A,
        delegate: D,
        shares: lpt(250),
        fees: 0n,
        lastClaimRound: 10,
      },
      snapshots: [{ account: A, delegate: D, round: 10, shares: lpt(250) }],
      pools: new Map(),
      rounds: rounds(10, 12),
    });
    expect(result.pendingStake).toBe(lpt(250));
    expect(result.series.map((p) => p.rewards)).toEqual([0, 0, 0]);
  });

  it("follows stake moved to another orchestrator without counting it as reward", () => {
    const pools = new Map([
      [
        D,
        new PoolHistory([
          pool(10, 1),
          pool(11, 1.1),
          pool(12, 1.1),
          pool(13, 1.2),
        ]),
      ],
      [
        E,
        new PoolHistory([
          pool(10, 2),
          pool(11, 2),
          pool(12, 2.2),
          pool(13, 2.2),
        ]),
      ],
    ]);
    // Alice holds 100 shares with D; at round 12 she transfers her 110 LPT
    // to E, where 110 LPT at CRF 2.2 is 50 shares.
    const result = computeAccount({
      account: {
        id: A,
        delegate: E,
        shares: lpt(50),
        fees: 0n,
        lastClaimRound: 12,
      },
      snapshots: [
        { account: A, delegate: D, round: 10, shares: lpt(100) },
        { account: A, delegate: E, round: 12, shares: lpt(50) },
      ],
      pools,
      rounds: rounds(10, 13),
    });

    expect(result.series.map((p) => +p.stake.toFixed(6))).toEqual([
      100, 110, 110, 110,
    ]);
    // Round 12 is earned on D (flat there); round 13 on E (flat there).
    expect(result.series.map((p) => +p.rewards.toFixed(6))).toEqual([
      0, 10, 0, 0,
    ]);
  });

  it("does not read an unbond as negative reward", () => {
    const pools = new Map([
      [D, new PoolHistory([pool(10, 1), pool(11, 1), pool(12, 1.1)])],
    ]);
    const result = computeAccount({
      account: {
        id: A,
        delegate: D,
        shares: lpt(40),
        fees: 0n,
        lastClaimRound: 11,
      },
      snapshots: [
        { account: A, delegate: D, round: 10, shares: lpt(100) },
        { account: A, delegate: D, round: 11, shares: lpt(40) },
      ],
      pools,
      rounds: rounds(10, 12),
    });
    expect(result.series.map((p) => +p.stake.toFixed(6))).toEqual([
      100, 40, 44,
    ]);
    expect(result.series.map((p) => +p.rewards.toFixed(6))).toEqual([0, 0, 4]);
  });

  it("accrues fees from the cumulative fee factor", () => {
    const pools = new Map([
      [
        D,
        new PoolHistory([
          pool(10, 1, { cff: 0n }),
          // 0.001 ETH per share-unit of PRECISE → 100 shares earn 0.1 ETH
          pool(11, 1, { cff: PRECISE / 1000n }),
        ]),
      ],
    ]);
    const result = computeAccount({
      account: {
        id: A,
        delegate: D,
        shares: lpt(100),
        fees: E18 / 2n,
        lastClaimRound: 10,
      },
      snapshots: [{ account: A, delegate: D, round: 10, shares: lpt(100) }],
      pools,
      rounds: rounds(10, 11),
    });
    expect(result.series[1].fees).toBeCloseTo(0.1, 9);
    // 0.5 ETH claimed + 0.1 ETH unclaimed since round 10
    expect(result.pendingFees).toBe(E18 / 2n + E18 / 10n);
  });

  it("tracks commission for a self-delegated orchestrator and resets it on claim", () => {
    const pools = new Map([
      [
        D,
        new PoolHistory([
          pool(10, 1, { totalStake: lpt(1000) }),
          pool(11, 1.009, {
            rewardTokens: lpt(10),
            rewardCut: 100_000n, // 10%
            totalStake: lpt(1000),
          }),
          pool(12, 1.018, {
            rewardTokens: lpt(10),
            rewardCut: 100_000n,
            totalStake: lpt(1000),
          }),
        ]),
      ],
    ]);
    const result = computeAccount({
      account: {
        id: D,
        delegate: D,
        shares: lpt(100),
        fees: 0n,
        lastClaimRound: 10,
        pendingRewardCommission: lpt(2),
      },
      snapshots: [{ account: D, delegate: D, round: 10, shares: lpt(100) }],
      pools,
      rounds: rounds(10, 12),
    });
    // Round 11: 0.9 on shares + 1 commission. Round 12: 0.9 + 1 + 9·1/1000.
    expect(result.series[1].rewards).toBeCloseTo(1.9, 6);
    expect(result.series[2].rewards).toBeCloseTo(1.909, 6);
    // Only the reward cut is commission; the 0.009 earned by staked
    // commission is ordinary yield on stake.
    expect(result.series[1].commission).toBeCloseTo(1, 6);
    expect(result.series[2].commission).toBeCloseTo(1, 6);
    expect(result.series[2].stake).toBeCloseTo(101.8 + 2.009, 6);
    expect(result.pendingStake).toBe(lpt(101.8) + lpt(2));
  });

  describe("a claim in a round with a reward call", () => {
    // Rewards of 10 LPT at a 10% cut in rounds 11 and 12; the orchestrator
    // claims in round 11, either after that round's reward call or before.
    const pools = new Map([
      [
        D,
        new PoolHistory([
          pool(10, 1, { totalStake: lpt(1000) }),
          pool(11, 1.009, {
            rewardTokens: lpt(10),
            rewardCut: 100_000n,
            totalStake: lpt(1000),
          }),
          pool(12, 1.018, {
            rewardTokens: lpt(10),
            rewardCut: 100_000n,
            totalStake: lpt(1000),
          }),
        ]),
      ],
    ]);
    const run = (claim: { shares: bigint; bondedAmount: bigint }) =>
      computeAccount({
        account: {
          id: D,
          delegate: D,
          shares: claim.shares,
          fees: 0n,
          lastClaimRound: 11,
          pendingRewardCommission: 0n,
        },
        snapshots: [
          { account: D, delegate: D, round: 10, shares: lpt(100) },
          { account: D, delegate: D, round: 11, ...claim },
        ],
        pools,
        rounds: rounds(10, 12),
      });

    it("doesn't count the round's commission again after a claim that included it", () => {
      // Claimed after the call: 100.9 on shares plus the 1 LPT cut, bonded
      // at round 11's final factor.
      const bonded = lpt(101.9);
      const result = run({
        bondedAmount: bonded,
        shares: (bonded * PRECISE) / factor(1.009),
      });
      // Only round 12's cut is still pending.
      expect(result.series[2].stake).toBeCloseTo(
        (101.9 * 1.018) / 1.009 + 1,
        6
      );
      // Round 11 still earned its cut once.
      expect(result.series[1].commission).toBeCloseTo(1, 6);
    });

    it("keeps the round's commission pending after a claim before its call", () => {
      // Claimed before the call: bonded at round 10's factor, no cut yet.
      const result = run({ bondedAmount: lpt(100), shares: lpt(100) });
      // Round 11's cut, then round 12's plus 9·1/1000 earned by the first.
      expect(result.series[2].stake).toBeCloseTo(101.8 + 2.009, 6);
    });
  });
});

describe("computePortfolio", () => {
  it("sums accounts and recomputes network share on the total", () => {
    const pools = new Map([
      [D, new PoolHistory([pool(10, 1), pool(11, 1.01)])],
    ]);
    const B = "0xbob";
    const result = computePortfolio({
      accounts: [
        { id: A, delegate: D, shares: lpt(100), fees: 0n, lastClaimRound: 10 },
        { id: B, delegate: D, shares: lpt(300), fees: 0n, lastClaimRound: 10 },
      ],
      snapshots: [
        { account: A, delegate: D, round: 10, shares: lpt(100) },
        { account: B, delegate: D, round: 11, shares: lpt(300) },
      ],
      pools,
      rounds: rounds(10, 11, 2000),
    });
    expect(result.series.map((p) => +p.stake.toFixed(6))).toEqual([100, 404]);
    expect(result.series[1].rewards).toBeCloseTo(1, 6); // Bob bonded in round 11
    expect(result.series[1].share).toBeCloseTo(20.2, 6);
    expect(result.pendingStake).toBe(lpt(404));
  });
});

describe("derived metrics", () => {
  it("measures round length from start timestamps", () => {
    expect(averageRoundSeconds(rounds(1, 10))).toBe(80_000);
  });

  it("annualizes a trailing per-round rate", () => {
    const series = [100, 101, 102.01, 103.0301].map((stake, i) => ({
      round: i,
      ts: i,
      stake,
      rewards: i === 0 ? 0 : stake - stake / 1.01,
      commission: 0,
      fees: 0,
      share: null,
    }));
    const rate = trailingRoundRate(series);
    expect(rate).toBeCloseTo(0.01, 9);
    expect(annualize(0.01, 365 * 86400)).toBeCloseTo(1, 9);
    expect(projectEarnings(100, 0.01, 2, 86400)).toBeCloseTo(2.01, 9);
  });

  it("keeps an orchestrator's commission out of its yield", () => {
    // A 2 LPT self-bond that earns 0.2% a round on its own stake and 1.5 LPT
    // a round of reward-cut commission from its delegators.
    const series = Array.from({ length: 31 }, (_, i) => ({
      round: i,
      ts: i,
      stake: 2,
      rewards: i === 0 ? 0 : 0.004 + 1.5,
      commission: i === 0 ? 0 : 1.5,
      fees: 0,
      share: null,
    }));
    const rate = trailingRoundRate(series);
    expect(rate).toBeCloseTo(0.002, 9);
    expect(trailingCommission(series)).toBeCloseTo(1.5, 9);
    // One year of 1-day rounds: stake compounds, commission accrues flat.
    const year = projectEarnings(2, rate, 365, 86400, 1.5);
    expect(year).toBeCloseTo(2 * (Math.pow(1.002, 365) - 1) + 1.5 * 365, 6);
    expect(annualize(rate, 86400)).toBeLessThan(200);
  });

  it("annualizes fees per LPT staked as a simple rate, valued in LPT", () => {
    // 1,000 LPT staked earning 0.01 ETH a round: 0.00001 ETH per LPT.
    const series = Array.from({ length: 31 }, (_, i) => ({
      round: i,
      ts: i,
      stake: 1000,
      rewards: 0,
      commission: 0,
      fees: i === 0 ? 0 : 0.01,
      share: null,
    }));
    const rate = trailingFeeRate(series);
    expect(rate).toBeCloseTo(0.00001, 12);
    // 365 one-day rounds at 200 LPT per ETH: 0.00001 × 200 × 365 = 73%.
    expect(annualizeFees(rate, 86400, 200)).toBeCloseTo(73, 6);
    expect(annualizeFees(rate, 86400, 0)).toBe(0);
  });
});

describe("averageStakeSince", () => {
  const point = (ts: number, stake: number) => ({
    round: ts,
    ts,
    stake,
    rewards: 0,
    commission: 0,
    fees: 0,
    share: 0,
  });

  it("averages the stake across the period's rounds", () => {
    const series = [point(1, 100), point(2, 100), point(3, 400)];
    expect(averageStakeSince(series, 0)).toBe(200);
  });

  it("counts a deposit from when it arrived, not from the start", () => {
    // 20 LPT, then 25,000 added: the start stake would make 1,864 earned
    // look like 9,000%.
    const series = [
      point(1, 20),
      point(2, 25_000),
      point(3, 25_000),
      point(4, 25_000),
    ];
    const avg = averageStakeSince(series, 0);
    expect(avg).toBe(18_755);
    expect((1_864 / avg) * 100).toBeCloseTo(9.94, 2);
  });

  it("skips rounds before the period and rounds with no stake", () => {
    const series = [point(1, 999), point(5, 0), point(6, 300), point(7, 500)];
    expect(averageStakeSince(series, 5)).toBe(400);
  });

  it("is 0 when nothing was staked", () => {
    expect(averageStakeSince([point(1, 0)], 0)).toBe(0);
    expect(averageStakeSince([], 0)).toBe(0);
  });
});
