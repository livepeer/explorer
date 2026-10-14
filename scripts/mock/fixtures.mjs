// Dev-only: deterministic mock of the Livepeer staging subgraph.
// Never import from app code. See scripts/mock/README.md.

/* ── PRNG ────────────────────────────────────────────────────────────────── */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Constants ───────────────────────────────────────────────────────────── */

export const CURRENT_ROUND = 4050;
export const HISTORY = 420;
export const FIRST_ROUND = CURRENT_ROUND - HISTORY + 1; // 3631
export const ROUND_LENGTH = 5760; // L1 blocks
export const ROUND_SECONDS = Math.round(22.4 * 3600); // 80640 → ~14 s/L1 block
export const UNBONDING_PERIOD = 7;

export const DEMO = {
  wallet: "0x22b544d19ffe43c6083327271d9f39020da30c65",
  watched: "0x6a7b132393431e2b83af171b4e6e5bf54c091421",
  orchestrator: "0x8b578b413186cd75590372acacb6fac64e9ead12",
};

const PRECISE = 10n ** 27n;
const WEI = 10n ** 18n;
const PPM = 1_000_000n;

export const toWei = (x) => BigInt(Math.round(x * 1e6)) * 10n ** 12n;
export const fromWei = (w) => Number(w) / 1e18;
export function weiToDec(w) {
  const neg = w < 0n;
  const a = neg ? -w : w;
  const whole = a / WEI;
  const frac = (a % WEI).toString().padStart(18, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${whole}${frac ? "." + frac : ""}`;
}
const dec = (x, d = 6) => {
  const s = Number(x).toFixed(d);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
};

/* ── Generator ───────────────────────────────────────────────────────────── */

export function generate({
  seed = 20260924,
  now = Math.floor(Date.now() / 1000),
} = {}) {
  const rnd = mulberry32(seed);
  const range = (a, b) => a + (b - a) * rnd();
  const int = (a, b) => Math.floor(range(a, b + 1));
  const pick = (xs) => xs[Math.floor(rnd() * xs.length)];
  const normal = () => {
    const u = Math.max(rnd(), 1e-12);
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
  };
  const hex = (n) => {
    let s = "";
    for (let i = 0; i < n; i++) s += "0123456789abcdef"[Math.floor(rnd() * 16)];
    return s;
  };
  const address = () => "0x" + hex(40);
  const txHash = () => "0x" + hex(64);

  const CUR = CURRENT_ROUND;
  const R0 = FIRST_ROUND;

  /* Round clock. The current round started ~7h ago. */
  const curStart = now - 7 * 3600 - 1234;
  const roundTs = new Map();
  for (let r = R0; r <= CUR; r++) {
    roundTs.set(
      r,
      r === CUR ? curStart : curStart - (CUR - r) * ROUND_SECONDS + int(0, 900)
    );
  }
  const startBlock = (r) => r * ROUND_LENGTH;
  const roundOfTs = (ts) => {
    for (let r = CUR; r >= R0; r--) if (roundTs.get(r) <= ts) return r;
    return R0;
  };
  // Random timestamp inside round r, never in the future.
  const tsIn = (r) => {
    const start = roundTs.get(r);
    const end = r === CUR ? now - 60 : roundTs.get(r + 1) - 60;
    return Math.floor(range(start + 120, Math.max(start + 121, end)));
  };

  /* ── Orchestrators ─────────────────────────────────────────────────────── */

  const NAMES = [
    "titan-node",
    "vires-in-numeris",
    "coef-video",
    "stronk-tech",
    "pon-node",
    "elitenode",
    "livepool",
    "nightnode",
    "xodeapp",
    "authority-null",
    "chainlab",
    "grant-orch",
    "karolak",
    "video-miner",
    "bitcr",
    "solar-farm",
    "streamflow",
    "transcode-eu",
    "hyperion",
    "lumen-ai",
    "mainframe",
    "oracle-video",
    "orbital",
    "pixelforge",
    "quasar",
    "redline",
    "sidestream",
    "tensorlab",
    "umbra",
    "vortex",
  ];

  const N_ACTIVE = 100;
  const N_INACTIVE = 3;
  const orchs = [];
  for (let i = 0; i < N_ACTIVE + N_INACTIVE; i++) {
    const active = i < N_ACTIVE;
    // Stake at the start of history: heavy head, long tail.
    const startStake = active
      ? Math.max(
          44_000 + range(0, 9000),
          900_000 * Math.exp(-i / 10) * range(0.85, 1.12)
        )
      : range(8000, 30000);
    const cutChoices = [
      20000, 25000, 30000, 50000, 60000, 75000, 80000, 100000, 100000, 120000,
      150000, 150000, 180000, 200000, 250000,
    ];
    const missRoll = rnd();
    orchs.push({
      i,
      id: address(),
      active,
      name: `${NAMES[i % NAMES.length]}${
        i >= NAMES.length ? "-" + Math.floor(i / NAMES.length) : ""
      }`,
      stake: startStake,
      rewardCut: pick(cutChoices),
      feeShare: pick([
        500000, 600000, 700000, 750000, 800000, 850000, 900000, 950000,
      ]),
      missRate:
        missRoll < 0.7
          ? 0
          : missRoll < 0.95
          ? range(0.01, 0.04)
          : range(0.08, 0.18),
      drift: 0.00015 + normal() * 0.0006,
      volumeWeight: Math.exp(normal() * 0.9) * (active ? 1 : 0.05),
      activationRound: active ? int(R0 - 2000, R0 - 50) : R0 - 800,
      cutHistory: [], // [{ round, rewardCut, feeShare }]
    });
  }

  // Demo orchestrators: B is a large one, A mid, C mid-tail, O is DEMO.orchestrator.
  const A = orchs[7];
  const B = orchs[2];
  const C = orchs[19];
  const O = orchs[11];
  O.id = DEMO.orchestrator;
  O.name = "demo-orchestrator";
  O.rewardCut = 100000;
  O.feeShare = 750000;
  O.missRate = 0;
  A.rewardCut = 80000;
  A.missRate = 0.01;
  B.rewardCut = 50000;
  B.feeShare = 850000;
  B.missRate = 0;
  C.rewardCut = 100000;
  C.missRate = 0;
  // A newcomer: joined the active set 8 rounds ago with a low cut, too
  // recent to rank on yield.
  const NEW = orchs[96];
  NEW.activationRound = CUR - 8;
  NEW.rewardCut = 20000;
  NEW.missRate = 0;
  const C_CUT_ROUND = CUR - 13; // ~12 days ago
  const C_NEW_CUT = 180000;
  const cMissed = new Set([CUR - 27, CUR - 19, CUR - 8, CUR - 3]);

  // A few other recent cut changes, for activity/insights.
  const cutChanges = new Map(); // orch index → { round, rewardCut, feeShare }
  cutChanges.set(C.i, {
    round: C_CUT_ROUND,
    rewardCut: C_NEW_CUT,
    feeShare: C.feeShare,
  });
  for (const idx of [4, 33, 58, 71]) {
    const o = orchs[idx];
    cutChanges.set(idx, {
      round: CUR - int(1, 8),
      rewardCut: Math.max(
        20000,
        o.rewardCut + pick([-50000, -25000, 25000, 50000])
      ),
      feeShare: Math.min(950000, o.feeShare + pick([0, 50000, -50000])),
    });
  }

  /* ── Round-by-round simulation ─────────────────────────────────────────── */

  const rounds = [];
  const pools = new Map(orchs.map((o) => [o.id, []]));
  const crf = new Map(orchs.map((o) => [o.id, new Map()]));
  const cff = new Map(orchs.map((o) => [o.id, new Map()]));
  const state = new Map(
    orchs.map((o) => [
      o.id,
      {
        crf: PRECISE + BigInt(Math.floor(range(0, 0.35) * 1e9)) * 10n ** 18n,
        cff: 0n,
        lifetimeReward: 0n,
        lifetimeFee: 0n,
      },
    ])
  );

  let inflation = 395_000; // ppb per round
  let ethPrice = 2650;
  let delegatorsCount = 4380;

  for (let r = R0; r <= CUR; r++) {
    const active = orchs.filter((o) => o.active);
    const tas = active.reduce((s, o) => s + o.stake, 0);
    const participation =
      0.5 + 0.018 * Math.sin((r - R0) / 37) + normal() * 0.002;
    const supply = tas / participation;
    inflation += participation < 0.5 ? 500 : -500;
    inflation = Math.min(400_000, Math.max(200_000, inflation));
    const mintable = (inflation / 1e9) * supply;
    const volumeETH = Math.max(
      1.5,
      (6 + 3.5 * Math.sin((r - R0) / 23) + normal() * 1.5) *
        (1 + (r - R0) / 800)
    );
    ethPrice = Math.max(1800, ethPrice * (1 + normal() * 0.02) + 1.2);
    const weightSum = orchs.reduce((s, o) => s + o.volumeWeight, 0);

    let roundFees = 0;
    for (const o of orchs) {
      const st = state.get(o.id);
      const change = cutChanges.get(o.i);
      if (change && r === change.round) {
        o.cutHistory.push({
          round: r,
          from: o.rewardCut,
          fromFee: o.feeShare,
          ...change,
        });
        o.rewardCut = change.rewardCut;
        o.feeShare = change.feeShare;
      }
      const prevCrf = st.crf;
      let rewardTokens = null;
      let called = o.active && rnd() >= o.missRate;
      if (o === C && cMissed.has(r)) called = false;
      if (r === CUR && o !== B && o !== C) called = called && rnd() < 0.72; // current round in progress
      if (r === CUR && o === C) called = false;
      const stakeWei = toWei(o.stake);
      if (called) {
        rewardTokens = (mintable * o.stake) / tas;
        const toDelegators = rewardTokens * (1 - o.rewardCut / 1e6);
        st.crf = prevCrf + (prevCrf * toWei(toDelegators)) / stakeWei;
        st.lifetimeReward += toWei(rewardTokens - toDelegators);
        o.lastRewardRound = r;
      }
      const fees = o.active
        ? Math.max(
            0,
            ((volumeETH * o.volumeWeight) / weightSum) *
              Math.exp(normal() * 0.35)
          )
        : 0;
      roundFees += fees;
      if (fees > 0) {
        const toDelegatorsFee = toWei(fees * (o.feeShare / 1e6));
        st.cff = st.cff + (toDelegatorsFee * prevCrf) / stakeWei;
        st.lifetimeFee += toWei(fees) - toDelegatorsFee;
      }
      crf.get(o.id).set(r, st.crf);
      cff.get(o.id).set(r, st.cff);
      pools.get(o.id).push({
        id: `${o.id}-${r}`,
        round: r,
        delegate: o.id,
        cumulativeRewardFactor: st.crf.toString(),
        cumulativeFeeFactor: st.cff.toString(),
        rewardTokens: rewardTokens == null ? null : dec(rewardTokens, 12),
        rewardCut: String(o.rewardCut),
        feeShare: String(o.feeShare),
        totalStake: dec(o.stake, 12),
        fees: dec(fees, 12),
        _rewardTokens: rewardTokens ?? 0,
        _fees: fees,
      });
      o.fees30 = (o.fees30 ?? []).concat(fees).slice(-38);
      o.feesAll = (o.feesAll ?? 0) + fees;
      // Next round's stake: compounding rewards plus net delegation flow.
      o.stake = Math.max(
        5000,
        o.stake + (rewardTokens ?? 0) + o.stake * (o.drift + normal() * 0.0025)
      );
    }
    delegatorsCount += int(-2, 4);

    rounds.push({
      id: String(r),
      startTimestamp: roundTs.get(r),
      initialized: true,
      length: String(ROUND_LENGTH),
      startBlock: String(startBlock(r)),
      endBlock: String(startBlock(r) + ROUND_LENGTH - 1),
      mintableTokens: dec(mintable, 8),
      volumeETH: dec(roundFees, 10),
      volumeUSD: dec(roundFees * ethPrice, 4),
      totalActiveStake: dec(tas, 8),
      totalSupply: dec(supply, 8),
      participationRate: dec(participation, 10),
      movedStake: dec(range(2000, 90000), 4),
      newStake: dec(range(3000, 65000), 4),
      inflation: String(inflation),
      numActiveTranscoders: "100",
      activeTranscoderCount: "100",
      delegatorsCount: String(delegatorsCount),
      _ethPrice: ethPrice,
    });
  }
  const roundByNum = new Map(rounds.map((r) => [Number(r.id), r]));
  const crfAt = (d, r) => crf.get(d).get(Math.max(R0, Math.min(CUR, r)));
  const cffAt = (d, r) => cff.get(d).get(Math.max(R0, Math.min(CUR, r)));
  // pool.totalStake is the stake at the start of the round; keep the live value too.
  const liveStake = new Map(
    orchs.map((o) => [o.id, Number(pools.get(o.id)[HISTORY - 1].totalStake)])
  );

  /* ── Delegators, snapshots, locks, events ──────────────────────────────── */

  const delegators = new Map();
  const snapshots = [];
  const locks = [];
  const events = [];

  const snap = (account, delegate, round, shares, ts) => {
    const bonded = delegate ? (shares * crfAt(delegate, round)) / PRECISE : 0n;
    snapshots.push({
      id: `${account}-${round}`,
      delegator: account,
      delegate,
      round,
      shares: shares.toString(),
      bondedAmount: weiToDec(bonded),
      timestamp: ts,
    });
  };
  const sharesFor = (wei, d, r) => (wei * PRECISE) / crfAt(d, r);
  const stakeOf = (shares, d, r) => (shares * crfAt(d, r)) / PRECISE;
  const feesBetween = (shares, d, from, to) =>
    (shares * (cffAt(d, to) - cffAt(d, from))) / PRECISE;

  let logIndex = 0;
  const addEvent = (
    type,
    round,
    fields,
    { ts = tsIn(round), from, tx } = {}
  ) => {
    const hash = tx ?? txHash();
    const e = {
      id: `${hash}-${logIndex++ % 7}`,
      __typename: type,
      round,
      timestamp: ts,
      tx: hash,
      from: from ?? fields.delegator ?? fields.delegate ?? address(),
      ...fields,
    };
    events.push(e);
    return e;
  };

  const putDelegator = (d) => delegators.set(d.id, d);

  // W — main wallet: A from ~3700, partial unbond, then moved to B at 3950.
  {
    const id = DEMO.wallet;
    const r1 = 3700,
      r2 = 3820,
      r3 = 3948,
      r4 = 3950;
    const bond1 = 32_900,
      bond2 = 1_500,
      unbondAmt = 1_200;
    const t1 = tsIn(r1),
      t2 = tsIn(r2),
      t3 = tsIn(r3),
      t4 = tsIn(r4);
    let shares = sharesFor(toWei(bond1), A.id, r1);
    snap(id, A.id, r1, shares, t1);
    addEvent(
      "BondEvent",
      r1,
      {
        delegator: id,
        newDelegate: A.id,
        oldDelegate: null,
        additionalAmount: String(bond1),
        bondedAmount: String(bond1),
      },
      { ts: t1 }
    );
    const s2 = stakeOf(shares, A.id, r2) + toWei(bond2);
    const feesA1 = feesBetween(shares, A.id, r1, r2);
    shares = sharesFor(s2, A.id, r2);
    snap(id, A.id, r2, shares, t2);
    addEvent(
      "BondEvent",
      r2,
      {
        delegator: id,
        newDelegate: A.id,
        oldDelegate: A.id,
        additionalAmount: String(bond2),
        bondedAmount: weiToDec(s2),
      },
      { ts: t2 }
    );
    const s3 = stakeOf(shares, A.id, r3) - toWei(unbondAmt);
    const feesA2 = feesBetween(shares, A.id, r2, r3);
    shares = sharesFor(s3, A.id, r3);
    snap(id, A.id, r3, shares, t3);
    addEvent(
      "UnbondEvent",
      r3,
      {
        delegator: id,
        delegate: A.id,
        amount: String(unbondAmt),
        withdrawRound: String(r3 + UNBONDING_PERIOD),
        unbondingLockId: 0,
      },
      { ts: t3 }
    );
    locks.push({
      id: `${id}-0`,
      unbondingLockId: 0,
      delegator: id,
      delegate: A.id,
      amount: String(unbondAmt),
      withdrawRound: String(r3 + UNBONDING_PERIOD),
    });
    const s4 = stakeOf(shares, A.id, r4);
    const feesA3 = feesBetween(shares, A.id, r3, r4);
    shares = sharesFor(s4, B.id, r4);
    snap(id, B.id, r4, shares, t4);
    addEvent(
      "BondEvent",
      r4,
      {
        delegator: id,
        newDelegate: B.id,
        oldDelegate: A.id,
        additionalAmount: "0",
        bondedAmount: weiToDec(s4),
      },
      { ts: t4 }
    );
    const claimedFees = feesA1 + feesA2 + feesA3;
    const withdrawn = (claimedFees * 8n) / 10n;
    addEvent("WithdrawFeesEvent", 3990, {
      delegator: id,
      amount: weiToDec(withdrawn),
    });
    putDelegator({
      id,
      delegate: B.id,
      startRound: String(r4 + 1),
      lastClaimRound: String(r4),
      bondedAmount: weiToDec(s4),
      principal: String(bond1 + bond2),
      unbonded: String(unbondAmt),
      fees: weiToDec(claimedFees - withdrawn),
      withdrawnFees: weiToDec(withdrawn),
      delegatedAmount: "0",
      shares: shares.toString(),
    });
  }

  // V — watched: C since 3760, unbonded 500 four rounds ago (unlocks in 3).
  {
    const id = DEMO.watched;
    const r1 = 3760,
      r2 = CUR - 4;
    const bond1 = 10_820,
      unbondAmt = 500;
    const t1 = tsIn(r1),
      t2 = tsIn(r2);
    let shares = sharesFor(toWei(bond1), C.id, r1);
    snap(id, C.id, r1, shares, t1);
    addEvent(
      "BondEvent",
      r1,
      {
        delegator: id,
        newDelegate: C.id,
        oldDelegate: null,
        additionalAmount: String(bond1),
        bondedAmount: String(bond1),
      },
      { ts: t1 }
    );
    const s2 = stakeOf(shares, C.id, r2) - toWei(unbondAmt);
    const fees = feesBetween(shares, C.id, r1, r2);
    shares = sharesFor(s2, C.id, r2);
    snap(id, C.id, r2, shares, t2);
    addEvent(
      "UnbondEvent",
      r2,
      {
        delegator: id,
        delegate: C.id,
        amount: String(unbondAmt),
        withdrawRound: String(r2 + UNBONDING_PERIOD),
        unbondingLockId: 0,
      },
      { ts: t2 }
    );
    locks.push({
      id: `${id}-0`,
      unbondingLockId: 0,
      delegator: id,
      delegate: C.id,
      amount: String(unbondAmt),
      withdrawRound: String(r2 + UNBONDING_PERIOD),
    });
    putDelegator({
      id,
      delegate: C.id,
      startRound: String(r1 + 1),
      lastClaimRound: String(r2),
      bondedAmount: weiToDec(s2),
      principal: String(bond1),
      unbonded: String(unbondAmt),
      fees: weiToDec(fees),
      withdrawnFees: "0",
      delegatedAmount: "0",
      shares: shares.toString(),
    });
  }

  // O — self-delegated orchestrator: claims every ~45 rounds, commission accrues between.
  const commissionFor = new Map();
  {
    const id = O.id;
    const claimRounds = [R0 + 2];
    for (let r = R0 + 47; r < CUR - 15; r += int(38, 52)) claimRounds.push(r);
    claimRounds.push(CUR - 17);
    const claimSet = new Set(claimRounds);
    const selfBond = 58_000;
    let shares = 0n;
    let commission = 0n;
    let feeCommission = 0n;
    const poolsO = new Map(pools.get(id).map((p) => [p.round, p]));
    for (let r = R0 + 2; r <= CUR; r++) {
      if (claimSet.has(r)) {
        const ts = tsIn(r);
        if (r === R0 + 2) {
          shares = sharesFor(toWei(selfBond), id, r);
          addEvent(
            "BondEvent",
            r,
            {
              delegator: id,
              newDelegate: id,
              oldDelegate: null,
              additionalAmount: String(selfBond),
              bondedAmount: String(selfBond),
            },
            { ts }
          );
        } else {
          const stake = stakeOf(shares, id, r - 1) + commission;
          shares = sharesFor(stake, id, r);
        }
        snap(id, id, r, shares, ts);
        commission = 0n;
        feeCommission = 0n;
      }
      const p = poolsO.get(r);
      if (p.rewardTokens) {
        const rt = toWei(p._rewardTokens);
        const cut = (rt * BigInt(p.rewardCut)) / PPM;
        const onStaked =
          ((rt - cut) * commission) / toWei(Number(p.totalStake));
        commission += cut + onStaked;
      }
      if (p._fees > 0)
        feeCommission += (toWei(p._fees) * (PPM - BigInt(p.feeShare))) / PPM;
    }
    const last = claimRounds[claimRounds.length - 1];
    commissionFor.set(id, { reward: commission, fee: feeCommission });
    putDelegator({
      id,
      delegate: id,
      startRound: String(R0 + 3),
      lastClaimRound: String(last),
      bondedAmount: weiToDec(stakeOf(shares, id, last)),
      principal: String(selfBond),
      unbonded: "0",
      fees: "0.412",
      withdrawnFees: "3.18",
      delegatedAmount: "0",
      shares: shares.toString(),
    });
    addEvent("WithdrawFeesEvent", CUR - 17, {
      delegator: id,
      amount: "0.8741",
    });
  }

  // Everyone else: self-bond plus a spread of delegators whose stake roughly sums to totalStake.
  const DEMO_DELEGATE_STAKE = new Map([
    [B.id, 42_000],
    [C.id, 12_500],
  ]);
  for (const o of orchs) {
    const total = liveStake.get(o.id);
    const selfFrac = o === O ? null : range(0.02, 0.14);
    if (o !== O) {
      const self = total * selfFrac;
      const start = R0 + int(0, 10);
      const shares = sharesFor(toWei(self), o.id, CUR);
      const lastClaim = CUR - int(1, 40);
      snap(o.id, o.id, start, shares, tsIn(start));
      putDelegator({
        id: o.id,
        delegate: o.id,
        startRound: String(start + 1),
        lastClaimRound: String(lastClaim),
        bondedAmount: weiToDec(stakeOf(shares, o.id, lastClaim)),
        principal: dec(self * 0.8, 4),
        unbonded: "0",
        fees: dec(range(0, 0.5), 6),
        withdrawnFees: dec(range(0, 8), 6),
        delegatedAmount: "0",
        shares: shares.toString(),
      });
      // Pending commission since last claim.
      let reward = 0n,
        fee = 0n;
      for (const p of pools.get(o.id)) {
        if (p.round <= lastClaim) continue;
        if (p.rewardTokens)
          reward += (toWei(p._rewardTokens) * BigInt(p.rewardCut)) / PPM;
        if (p._fees > 0)
          fee += (toWei(p._fees) * (PPM - BigInt(p.feeShare))) / PPM;
      }
      commissionFor.set(o.id, { reward, fee });
    }
    const selfStake = fromWei(
      stakeOf(BigInt(delegators.get(o.id).shares), o.id, CUR)
    );
    let rest = Math.max(
      0,
      total - selfStake - (DEMO_DELEGATE_STAKE.get(o.id) ?? 0)
    );
    const n = o.active
      ? Math.max(4, Math.min(180, Math.round((total / 9000) * range(0.4, 1.3))))
      : int(1, 4);
    const weights = Array.from({ length: n }, () => Math.exp(normal() * 1.4));
    const wsum = weights.reduce((a, b) => a + b, 0);
    for (const w of weights) {
      const amt = (rest * w) / wsum;
      if (amt < 1) continue;
      const id = address();
      const start = int(R0, CUR - 1);
      const lastClaim = int(start, CUR);
      const shares = sharesFor(toWei(amt), o.id, CUR);
      snap(id, o.id, start, shares, tsIn(start));
      putDelegator({
        id,
        delegate: o.id,
        startRound: String(start + 1),
        lastClaimRound: String(lastClaim),
        bondedAmount: weiToDec(stakeOf(shares, o.id, lastClaim)),
        principal: dec(amt * 0.85, 4),
        unbonded: "0",
        fees: dec(range(0, 0.05), 6),
        withdrawnFees: dec(range(0, 0.3), 6),
        delegatedAmount: "0",
        shares: shares.toString(),
      });
    }
  }

  /* ── Transcoders ───────────────────────────────────────────────────────── */

  const dayStart = (ts) => ts - (ts % 86400);
  const transcoders = orchs.map((o) => {
    const c = commissionFor.get(o.id) ?? { reward: 0n, fee: 0n };
    const st = state.get(o.id);
    const lastChange = o.cutHistory[o.cutHistory.length - 1];
    const activationTs = dayStart(
      roundTs.get(R0) - (R0 - o.activationRound) * ROUND_SECONDS
    );
    const cutTs = lastChange
      ? dayStart(roundTs.get(lastChange.round))
      : Math.max(
          activationTs,
          dayStart(roundTs.get(R0) - int(10, 400) * 86400)
        );
    const selfD = delegators.get(o.id);
    const thirty = o.fees30.slice(-35).reduce((a, b) => a + b, 0);
    return {
      id: o.id,
      active: o.active,
      status: "Registered",
      totalStake: dec(liveStake.get(o.id), 12),
      rewardCut: String(o.rewardCut),
      feeShare: String(o.feeShare),
      rewardCutUpdateTimestamp: cutTs,
      feeShareUpdateTimestamp: cutTs,
      activationTimestamp: dayStart(
        roundTs.get(R0) - (R0 - o.activationRound) * ROUND_SECONDS
      ),
      activationRound: String(o.activationRound),
      // Never deactivated: the contract's sentinel (2^255 - 1).
      deactivationRound: o.active ? String(2n ** 255n - 1n) : String(CUR - 40),
      lastRewardRound: o.lastRewardRound ?? null,
      thirtyDayVolumeETH: dec(thirty, 10),
      ninetyDayVolumeETH: dec(thirty * range(2.6, 3.3), 10),
      totalVolumeETH: dec(o.feesAll * range(2.5, 6), 10),
      serviceURI: o.active ? `https://${o.name}.orch.example:8935` : null,
      pendingRewardCommission: c.reward.toString(),
      pendingFeeCommission: c.fee.toString(),
      lifetimeRewardCommission: (st.lifetimeReward * 3n).toString(),
      lifetimeFeeCommission: (st.lifetimeFee * 3n).toString(),
      _selfBonded: selfD?.bondedAmount ?? "0",
    };
  });

  /* ── Network events ────────────────────────────────────────────────────── */

  // Cut changes.
  for (const o of orchs) {
    for (const ch of o.cutHistory) {
      const ts = o === C ? now - 12 * 86400 : tsIn(ch.round);
      addEvent(
        "TranscoderUpdateEvent",
        roundOfTs(ts),
        {
          delegate: o.id,
          rewardCut: String(ch.rewardCut),
          feeShare: String(ch.feeShare),
        },
        { ts, from: o.id }
      );
    }
  }
  // Reward calls in the current round (and the tail of the previous one).
  for (const o of orchs) {
    for (const r of [CUR - 1, CUR]) {
      const p = pools.get(o.id).find((x) => x.round === r);
      if (!p?.rewardTokens) continue;
      if (r === CUR - 1 && rnd() < 0.8) continue;
      addEvent(
        "RewardEvent",
        r,
        { delegate: o.id, rewardTokens: p.rewardTokens },
        { from: o.id }
      );
    }
  }
  // Delegator churn over the last few rounds.
  const pool = [...delegators.values()].filter((d) => d.id !== d.delegate);
  const active = orchs.filter((o) => o.active);
  for (let k = 0; k < 150; k++) {
    const r = rnd() < 0.55 ? CUR : CUR - int(1, 4);
    const d = pick(pool);
    const roll = rnd();
    const amount = dec(Math.exp(range(Math.log(5), Math.log(40000))), 4);
    if (roll < 0.36) {
      const moving = rnd() < 0.3;
      addEvent("BondEvent", r, {
        delegator: d.id,
        newDelegate: moving ? pick(active).id : d.delegate,
        oldDelegate: moving ? d.delegate : rnd() < 0.5 ? d.delegate : null,
        additionalAmount: moving ? "0" : amount,
        bondedAmount: amount,
      });
    } else if (roll < 0.56) {
      addEvent("UnbondEvent", r, {
        delegator: d.id,
        delegate: d.delegate,
        amount,
        withdrawRound: String(r + UNBONDING_PERIOD),
        unbondingLockId: int(0, 4),
      });
    } else if (roll < 0.64) {
      addEvent("RebondEvent", r, {
        delegator: d.id,
        delegate: d.delegate,
        amount,
        unbondingLockId: int(0, 3),
      });
    } else if (roll < 0.78) {
      addEvent("WithdrawStakeEvent", r, {
        delegator: d.id,
        amount,
        unbondingLockId: int(0, 3),
      });
    } else if (roll < 0.97) {
      addEvent("WithdrawFeesEvent", r, {
        delegator: d.id,
        amount: dec(range(0.0005, 0.6), 8),
      });
    } else {
      addEvent(
        "TranscoderActivatedEvent",
        r,
        { delegate: pick(active).id },
        { from: address() }
      );
    }
  }
  events.sort((a, b) => b.timestamp - a.timestamp);

  const transactions = new Map();
  for (const e of events) {
    if (!transactions.has(e.tx))
      transactions.set(e.tx, {
        id: e.tx,
        from: e.from,
        timestamp: e.timestamp,
        events: [],
      });
    transactions.get(e.tx).events.push(e);
  }

  /* ── Days ──────────────────────────────────────────────────────────────── */

  const days = [];
  const today = dayStart(now);
  for (let k = 364; k >= 0; k--) {
    const date = today - k * 86400;
    const r = roundByNum.get(Math.max(R0, roundOfTs(date))) ?? rounds[0];
    const vol =
      ((Number(r.volumeETH) * 86400) / ROUND_SECONDS) *
      Math.exp(normal() * 0.15);
    days.push({
      id: String(date / 86400),
      date,
      volumeETH: dec(vol, 10),
      volumeUSD: dec(vol * r._ethPrice, 4),
      totalActiveStake: r.totalActiveStake,
      totalSupply: r.totalSupply,
      participationRate: r.participationRate,
      inflation: r.inflation,
      numActiveTranscoders: "100",
      activeTranscoderCount: "100",
      delegatorsCount: r.delegatorsCount,
    });
  }

  /* ── Governance ────────────────────────────────────────────────────────── */

  const bigId = () => {
    let s = String(int(1, 9));
    for (let i = 0; i < 76; i++) s += String(int(0, 9));
    return s;
  };
  const tas = Number(rounds[rounds.length - 1].totalActiveStake);
  const proposal = (
    title,
    body,
    voteStart,
    voteEnd,
    forFrac,
    againstFrac,
    abstainFrac
  ) => {
    const f = tas * forFrac,
      a = tas * againstFrac,
      ab = tas * abstainFrac;
    return {
      id: bigId(),
      proposer: pick([B.id, A.id, O.id, orchs[0].id, orchs[1].id]),
      voteStart: String(voteStart),
      voteEnd: String(voteEnd),
      description: `# ${title}\n\n${body}`,
      forVotes: dec(f, 8),
      againstVotes: dec(a, 8),
      abstainVotes: dec(ab, 8),
      totalVotes: dec(f + a + ab, 8),
    };
  };
  const lorem =
    "## Summary\n\nThis proposal requests funding from the on-chain treasury.\n\n## Motivation\n\nThe network needs sustained investment in tooling, documentation and orchestrator onboarding.\n\n## Specification\n\n- Milestone 1: design and scoping\n- Milestone 2: implementation\n- Milestone 3: rollout and reporting\n\n## Budget\n\nFunds are released per milestone by the multisig.";
  const treasuryProposals = [
    proposal(
      "Livepeer AI SPE: Phase 3 funding (250,000 LPT)",
      lorem,
      CUR - 4,
      CUR + 6,
      0.21,
      0.018,
      0.006
    ),
    proposal(
      "Treasury contribution to the Livepeer Foundation grants program",
      lorem,
      CUR + 1,
      CUR + 11,
      0,
      0,
      0
    ),
    proposal(
      "Streamplace SPE: decentralised livestreaming infrastructure",
      lorem,
      CUR - 38,
      CUR - 28,
      0.33,
      0.02,
      0.011
    ),
    proposal(
      "Orchestrator tooling SPE extension",
      lorem,
      CUR - 71,
      CUR - 61,
      0.09,
      0.24,
      0.004
    ),
    proposal(
      "Public goods funding round Q2",
      lorem,
      CUR - 112,
      CUR - 102,
      0.052,
      0.003,
      0.001
    ),
    proposal(
      "Security audit budget for protocol upgrade LIP-100",
      lorem,
      CUR - 160,
      CUR - 150,
      0.41,
      0.007,
      0.002
    ),
  ];

  const b58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const ipfs = () =>
    "Qm" +
    Array.from({ length: 44 }, () => b58[Math.floor(rnd() * b58.length)]).join(
      ""
    );
  const curBlockNow = startBlock(CUR) + Math.floor((now - curStart) / 14);
  const poll = (endBlock, yesFrac, noFrac, voters) => ({
    id: address(),
    proposal: ipfs(),
    endBlock: String(endBlock),
    quorum: "333300",
    quota: "500000",
    tally:
      yesFrac + noFrac > 0
        ? { yes: dec(tas * yesFrac, 8), no: dec(tas * noFrac, 8) }
        : null,
    votes: Array.from({ length: voters }, () => ({ id: address() })),
  });
  const polls = [
    poll(curBlockNow + Math.floor((5 * 86400) / 14), 0.19, 0.012, 34),
    poll(curBlockNow - Math.floor((40 * 86400) / 14), 0.41, 0.02, 96),
    poll(curBlockNow - Math.floor((120 * 86400) / 14), 0.12, 0.25, 71),
    poll(curBlockNow - Math.floor((210 * 86400) / 14), 0.08, 0.004, 22),
    poll(curBlockNow - Math.floor((330 * 86400) / 14), 0.38, 0.01, 118),
  ];

  const protocol = {
    currentRound: CUR,
    lastInitializedRound: CUR,
    roundLength: String(ROUND_LENGTH),
    totalActiveStake: rounds[rounds.length - 1].totalActiveStake,
    totalSupply: rounds[rounds.length - 1].totalSupply,
    participationRate: rounds[rounds.length - 1].participationRate,
    inflation: rounds[rounds.length - 1].inflation,
    inflationChange: "500",
    targetBondingRate: "500000000",
    numActiveTranscoders: "100",
    activeTranscoderCount: "100",
    delegatorsCount: String(delegators.size),
    totalVolumeETH: dec(
      rounds.reduce((s, r) => s + Number(r.volumeETH), 0) * 3.4,
      6
    ),
    totalVolumeUSD: dec(
      rounds.reduce((s, r) => s + Number(r.volumeUSD), 0) * 3.4,
      2
    ),
    unbondingPeriod: String(UNBONDING_PERIOD),
    paused: false,
  };

  // The newcomer has no pools from before it joined.
  pools.set(
    NEW.id,
    pools.get(NEW.id).filter((p) => p.round >= NEW.activationRound)
  );

  return {
    now,
    protocol,
    rounds,
    roundByNum,
    pools,
    transcoders,
    delegators,
    snapshots: snapshots.sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    ),
    locks,
    events,
    transactions: [...transactions.values()],
    days,
    treasuryProposals,
    polls,
    demo: { ...DEMO, A: A.id, B: B.id, C: C.id, O: O.id },
  };
}
