import {
  computeAccount,
  PoolHistory,
  type PoolPoint,
  PRECISE,
  type RoundPoint,
} from "./compute";
import { preClaimSnapshots } from "./pre-claim";

const E18 = 10n ** 18n;
/** CRF as a decimal multiple of PRECISE, e.g. 1.01 → 1.01e27 */
const factor = (n: number) =>
  (BigInt(Math.round(n * 1e9)) * PRECISE) / 10n ** 9n;

const pool = (round: number, crf: number): PoolPoint => ({
  round,
  crf: factor(crf),
  cff: 0n,
  rewardTokens: null,
  rewardCut: 0n,
  feeShare: 1_000_000n,
  totalStake: 0n,
  fees: 0n,
});

const rounds = (from: number, to: number): RoundPoint[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    round: from + i,
    ts: 1_700_000_000 + (from + i) * 80_000,
    totalActiveStake: 1000,
  }));

const ORCH = "0xorch";
const NEW = "0xnew";
const migrations = new Map([
  ["0xl1orch", { l1Addr: "0xl1orch", l2Addr: ORCH, round: 10, timestamp: 1 }],
]);
const claim = {
  account: "0xme",
  l1Delegate: "0xl1orch",
  stake: 100n * E18,
  round: 20,
};
const pools = new Map([
  [ORCH, new PoolHistory([pool(10, 2), pool(15, 2.2), pool(20, 2.4)])],
  [NEW, new PoolHistory([pool(20, 1)])],
]);

describe("preClaimSnapshots", () => {
  it("holds the snapshot stake as pool shares from the migration", () => {
    const [s] = preClaimSnapshots([claim], migrations, [], pools);
    expect(s).toMatchObject({ account: "0xme", delegate: ORCH, round: 10 });
    // 100 LPT at a factor of 2 → 50 shares.
    expect(s.shares).toBe(50n * E18);
  });

  it("skips claims from orchestrators that never migrated", () => {
    const orphan = { ...claim, l1Delegate: "0xnowhere" };
    expect(preClaimSnapshots([orphan], migrations, [], pools)).toEqual([]);
  });

  it("skips accounts that already had Arbitrum stake before claiming", () => {
    const earlier = [
      { account: "0xme", delegate: NEW, round: 12, shares: E18 },
    ];
    expect(preClaimSnapshots([claim], migrations, earlier, pools)).toEqual([]);
  });

  it("starts history at the migration, with rewards until the claim", () => {
    // Claimed at round 20 into a new orchestrator: 100 · 2.4/2 = 120 LPT.
    const claimed = {
      account: "0xme",
      delegate: NEW,
      round: 20,
      shares: 120n * E18,
    };
    const snapshots = [
      ...preClaimSnapshots([claim], migrations, [claimed], pools),
      claimed,
    ];
    const { series } = computeAccount({
      account: {
        id: "0xme",
        delegate: NEW,
        shares: 120n * E18,
        fees: 0n,
        lastClaimRound: 20,
      },
      snapshots,
      pools,
      rounds: rounds(9, 21),
    });
    expect(series[0]).toMatchObject({ round: 10, stake: 100 });
    expect(series.find((p) => p.round === 15)).toMatchObject({
      stake: 110,
      rewards: 10,
    });
    // Round 20's reward is still the pool's; the claim carries it over.
    expect(series.find((p) => p.round === 20)).toMatchObject({
      stake: 120,
      rewards: 10,
    });
    const earned = series.reduce((sum, p) => sum + p.rewards, 0);
    expect(earned).toBeCloseTo(20);
  });
});
