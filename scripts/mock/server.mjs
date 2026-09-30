// Dev-only mock of the Livepeer staging subgraph + CoinGecko price endpoint.
// Usage: node scripts/mock/server.mjs [--port 4010] [--seed 20260924]
// Answers the operations in lib/subgraph/{portfolio,network}.ts by operation name.

import http from "node:http";

import {
  concat,
  encodeFunctionData,
  encodePacked,
  getAddress,
  keccak256,
  size,
  toBytes,
} from "viem";

import { generate, ROUND_SECONDS } from "./fixtures.mjs";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const PORT = Number(arg("port", process.env.MOCK_PORT ?? 4010));
const SEED = Number(arg("seed", 20260924));
const VERBOSE = process.argv.includes("--verbose");

const f = generate({
  seed: SEED,
  now: Number(process.env.MOCK_NOW) || undefined,
});
console.log(
  `[mock] seed=${SEED} round=${f.protocol.currentRound} orchestrators=${f.transcoders.length} ` +
    `delegators=${f.delegators.size} pools=${[...f.pools.values()].reduce(
      (s, p) => s + p.length,
      0
    )} events=${f.events.length}`
);
console.log(`[mock] demo: ${JSON.stringify(f.demo)}`);

export const COINGECKO = {
  livepeer: { usd: 6.42, usd_24h_change: 1.8 },
  ethereum: { usd: 3120.5 },
};

/* ── Shapers ─────────────────────────────────────────────────────────────── */

const ref = (id) => (id == null ? null : { id: String(id) });
const byIdAsc = (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const page = (rows, { first = 100, lastId = "" } = {}) =>
  rows
    .filter((r) => r.id > (lastId ?? ""))
    .sort(byIdAsc)
    .slice(0, first);
const lower = (xs) => (xs ?? []).map((x) => String(x).toLowerCase());

const transcoderById = new Map(f.transcoders.map((t) => [t.id, t]));
const delegatorsByDelegate = new Map();
for (const d of f.delegators.values()) {
  if (!d.delegate) continue;
  if (!delegatorsByDelegate.has(d.delegate))
    delegatorsByDelegate.set(d.delegate, []);
  delegatorsByDelegate.get(d.delegate).push(d);
}

function shapeDelegator(d) {
  const t = d.delegate ? transcoderById.get(d.delegate) : null;
  return {
    id: d.id,
    bondedAmount: d.bondedAmount,
    principal: d.principal,
    unbonded: d.unbonded,
    fees: d.fees,
    withdrawnFees: d.withdrawnFees,
    shares: d.shares,
    startRound: d.startRound,
    lastClaimRound: ref(d.lastClaimRound),
    delegate: t
      ? {
          id: t.id,
          activationRound: t.activationRound,
          deactivationRound: t.deactivationRound,
          status: t.status,
          rewardCut: t.rewardCut,
          feeShare: t.feeShare,
          totalStake: t.totalStake,
          lastRewardRound: ref(t.lastRewardRound),
          pendingRewardCommission: t.pendingRewardCommission,
          pendingFeeCommission: t.pendingFeeCommission,
        }
      : null,
    unbondingLocks: f.locks
      .filter((l) => l.delegator === d.id)
      .map((l) => ({
        id: l.id,
        unbondingLockId: l.unbondingLockId,
        amount: l.amount,
        withdrawRound: l.withdrawRound,
        delegate: { id: l.delegate },
      })),
  };
}

function shapePool(p, withTs) {
  return {
    id: p.id,
    round: withTs
      ? {
          id: String(p.round),
          startTimestamp: f.roundByNum.get(p.round).startTimestamp,
        }
      : { id: String(p.round) },
    cumulativeRewardFactor: p.cumulativeRewardFactor,
    cumulativeFeeFactor: p.cumulativeFeeFactor,
    rewardTokens: p.rewardTokens,
    rewardCut: p.rewardCut,
    feeShare: p.feeShare,
    totalStake: p.totalStake,
    fees: p.fees,
  };
}

function windowPools(id, windowStart) {
  return f.pools
    .get(id)
    .filter((p) => f.roundByNum.get(p.round).startTimestamp >= windowStart)
    .sort((a, b) => (a.id < b.id ? 1 : -1))
    .slice(0, 60)
    .map((p) => ({
      round: { id: String(p.round) },
      rewardTokens: p.rewardTokens,
      rewardCut: p.rewardCut,
      cumulativeRewardFactor: p.cumulativeRewardFactor,
    }));
}

function shapeTranscoder(t, windowStart, withLifetime) {
  const out = {
    id: t.id,
    activationRound: t.activationRound,
    deactivationRound: t.deactivationRound,
    status: t.status,
    totalStake: t.totalStake,
    rewardCut: t.rewardCut,
    feeShare: t.feeShare,
    rewardCutUpdateTimestamp: t.rewardCutUpdateTimestamp,
    feeShareUpdateTimestamp: t.feeShareUpdateTimestamp,
    activationTimestamp: t.activationTimestamp,
    lastRewardRound: ref(t.lastRewardRound),
    thirtyDayVolumeETH: t.thirtyDayVolumeETH,
    ninetyDayVolumeETH: t.ninetyDayVolumeETH,
    totalVolumeETH: t.totalVolumeETH,
    serviceURI: t.serviceURI,
    delegator: { bondedAmount: t._selfBonded },
    delegators: (delegatorsByDelegate.get(t.id) ?? [])
      .slice(0, 1000)
      .map((d) => ({ id: d.id })),
    pools: windowPools(t.id, windowStart),
  };
  if (withLifetime) {
    out.lifetimeRewardCommission = t.lifetimeRewardCommission;
    out.lifetimeFeeCommission = t.lifetimeFeeCommission;
  }
  return out;
}

function shapeEvent(e) {
  const base = {
    id: e.id,
    __typename: e.__typename,
    round: { id: String(e.round) },
    timestamp: e.timestamp,
    transaction: { id: e.tx, from: e.from },
  };
  switch (e.__typename) {
    case "BondEvent":
      return {
        ...base,
        delegator: ref(e.delegator),
        newDelegate: ref(e.newDelegate),
        oldDelegate: ref(e.oldDelegate),
        additionalAmount: e.additionalAmount,
      };
    case "UnbondEvent":
    case "RebondEvent":
      return {
        ...base,
        delegate: ref(e.delegate),
        delegator: ref(e.delegator),
        amount: e.amount,
      };
    case "TranscoderUpdateEvent":
      return {
        ...base,
        delegate: ref(e.delegate),
        rewardCut: e.rewardCut,
        feeShare: e.feeShare,
      };
    case "RewardEvent":
      return {
        ...base,
        delegate: ref(e.delegate),
        rewardTokens: e.rewardTokens,
      };
    case "WithdrawStakeEvent":
    case "WithdrawFeesEvent":
      return { ...base, delegator: ref(e.delegator), amount: e.amount };
    case "TranscoderActivatedEvent":
    case "TranscoderDeactivatedEvent":
      return { ...base, delegate: ref(e.delegate) };
    case "WinningTicketRedeemedEvent":
      return {
        ...base,
        recipient: ref(e.delegate),
        sender: ref(e.gateway),
        faceValue: e.amount,
      };
    case "DepositFundedEvent":
      return { ...base, sender: ref(e.gateway), amount: e.amount };
    case "ReserveFundedEvent":
      return { ...base, reserveHolder: ref(e.gateway), amount: e.amount };
    case "WithdrawalEvent":
      return {
        ...base,
        sender: ref(e.gateway),
        deposit: e.deposit,
        reserve: e.reserve,
      };
    case "VoteEvent":
      return {
        ...base,
        pollVoter: e.delegator,
        choiceID: e.choiceID,
        poll: ref(e.poll),
      };
    case "TreasuryVoteEvent":
      return {
        ...base,
        treasuryVoter: ref(e.delegator),
        support: e.support,
        weight: e.amount,
        treasuryProposal: ref(e.proposal),
      };
    case "PollCreatedEvent":
      return { ...base, poll: ref(e.poll) };
    default:
      return base;
  }
}

/* ── Resolvers (by operation name) ───────────────────────────────────────── */

/* ── Governance votes (derived deterministically from each tally) ───────── */

function seeded(key) {
  let h = 2166136261;
  for (const c of String(key)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const hex = (rnd, n) =>
  Array.from({ length: n }, () => Math.floor(rnd() * 16).toString(16)).join("");

const REASONS = [
  "Supporting this. The milestones are clear and the team has delivered before.",
  "Against for now: the budget is large relative to the treasury and the reporting cadence is vague. Happy to revisit with quarterly check-ins.",
  "Abstaining until the SPE publishes its previous quarter's spend.",
  "This directly benefits orchestrators and the delegators who back them. Voting for.",
];

/**
 * Voters for a tally: mostly active orchestrators (by stake), then some
 * delegators. Choices follow the tally's proportions and weights are scaled
 * so each choice sums to its tally.
 */
function mockVoters(key, count, buckets) {
  const rnd = seeded(key);
  const active = f.transcoders
    .filter((t) => t.active)
    .sort((a, b) => Number(b.totalStake) - Number(a.totalStake));
  const delegators = [...f.delegators.values()].filter(
    (d) => Number(d.bondedAmount) > 0
  );
  const total = buckets.reduce((s, b) => s + b.value, 0);
  if (!count || total <= 0) return [];
  const voters = [];
  const orchCount = Math.min(active.length, Math.round(count * 0.6));
  for (const t of active) {
    if (voters.length >= orchCount) break;
    if (rnd() < 0.72)
      voters.push({ id: t.id, stake: Number(t.totalStake), orch: true });
  }
  while (voters.length < count && delegators.length) {
    const d = delegators[Math.floor(rnd() * delegators.length)];
    if (!voters.some((v) => v.id === d.id))
      voters.push({ id: d.id, stake: Number(d.bondedAmount), orch: false });
  }
  for (const v of voters) {
    let r = rnd() * total;
    v.choice = buckets.find((b) => (r -= b.value) <= 0)?.key ?? buckets[0].key;
  }
  for (const b of buckets) {
    const group = voters.filter((v) => v.choice === b.key);
    const sum = group.reduce((s, v) => s + v.stake, 0);
    for (const v of group) v.weight = sum > 0 ? (v.stake / sum) * b.value : 0;
  }
  return voters.map((v) => ({
    ...v,
    timestamp: Math.floor(f.now - rnd() * 6 * 86400),
    tx: "0x" + hex(rnd, 64),
    reason:
      !v.orch || rnd() > 0.3
        ? null
        : REASONS[Math.floor(rnd() * REASONS.length)],
  }));
}

/* ── Gateways: deposits, daily fees and the tickets behind them ─────────── */

const DAY = 86400;
const GATEWAY_DEMO = "0x3f1c7a9e5b2d4c6e8a0b1d3f5e7c9a2b4d6f8e01";

const gateways = (() => {
  const rnd = seeded(`gateways-${SEED}`);
  const today = Math.floor(f.now / DAY) * DAY;
  const active = f.transcoders
    .filter((t) => t.active)
    .sort((a, b) => Number(b.totalStake) - Number(a.totalStake));
  // One orchestrator also runs a gateway and redeems some of its own tickets.
  const selfOrch = active[6];
  const out = [];
  for (let i = 0; i < 26; i++) {
    const id =
      i === 0 ? GATEWAY_DEMO : i === 1 ? selfOrch.id : "0x" + hex(rnd, 40);
    // Heavy-tailed daily pace: a few gateways carry most of the demand.
    // Scaled so all gateways together roughly match the network's daily fees.
    const pace =
      0.6 * (i === 0 ? 0.9 : i === 1 ? 0.35 : 1.6 * rnd() ** 3.2 + 0.004);
    const startDay = i === 0 ? 340 : Math.floor(30 + rnd() * 330);
    // Some stopped paying: still listed while they started within a year.
    const stoppedDay =
      i > 1 && rnd() < 0.18 ? Math.floor(95 + rnd() * (startDay - 95)) : 0;
    const peers = [...active]
      .sort(() => rnd() - 0.5)
      .slice(0, 3 + Math.floor(rnd() * 10));
    if (i === 1) peers.unshift(selfOrch, selfOrch);
    out.push({
      id,
      pace,
      startDay,
      stoppedDay: startDay > 95 ? stoppedDay : 0,
      peers,
      runway: i === 0 ? 11 : 4 + rnd() * 180,
      reserve: i === 0 ? 1.5 : rnd() < 0.3 ? 0 : 0.2 + rnd() * 4,
      days: [],
      tickets: [],
      funding: [],
    });
  }
  for (const g of out) {
    for (let ago = g.startDay; ago >= 0; ago--) {
      if (g.stoppedDay && ago < g.stoppedDay) break;
      const date = today - ago * DAY;
      if (rnd() < 0.08) continue;
      const growth = 0.6 + 0.8 * (1 - ago / 365);
      let vol = g.pace * growth * (0.55 + rnd() * 0.9);
      if (ago < 90) {
        // Recent days are built from tickets so payouts add up to the days.
        vol = 0;
        const n = 1 + Math.floor(rnd() * 5);
        for (let k = 0; k < n; k++) {
          const fee = (g.pace * growth * (0.55 + rnd() * 0.9)) / n;
          const ts = Math.min(f.now - 60, date + Math.floor(rnd() * DAY));
          const to = g.peers[Math.floor(rnd() ** 1.6 * g.peers.length)];
          g.tickets.push({
            id: `0x${hex(rnd, 64)}-${k}`,
            __typename: "WinningTicketRedeemedEvent",
            round: roundAt(ts),
            timestamp: ts,
            tx: "0x" + hex(rnd, 64),
            from: to.id,
            delegate: to.id,
            gateway: g.id,
            amount: fee.toFixed(8),
          });
          vol += fee;
        }
      }
      g.days.push({ date, volumeETH: vol });
    }
    const sum = (n) =>
      g.days
        .filter((d) => d.date > today - n * DAY)
        .reduce((s, d) => s + d.volumeETH, 0);
    g.thirty = sum(30);
    g.ninety = sum(90);
    g.total = g.days.reduce((s, d) => s + d.volumeETH, 0);
    g.deposit = g.stoppedDay ? 0 : (g.thirty / 30 || g.pace) * g.runway;
    if (g.stoppedDay) g.reserve = 0;
    // Top-ups roughly monthly, a reserve at the start, a withdrawal on exit.
    const fund = (__typename, ago, extra) => {
      const ts = Math.min(f.now - 120, today - ago * DAY + 3600 * 9);
      g.funding.push({
        id: `0x${hex(rnd, 64)}-f`,
        __typename,
        round: roundAt(ts),
        timestamp: ts,
        tx: "0x" + hex(rnd, 64),
        from: g.id,
        gateway: g.id,
        ...extra,
      });
    };
    fund("ReserveFundedEvent", g.startDay, {
      amount: (g.reserve || 1).toFixed(4),
    });
    for (
      let ago = g.startDay;
      ago > (g.stoppedDay || 0);
      ago -= 26 + Math.floor(rnd() * 12)
    )
      fund("DepositFundedEvent", ago, { amount: (g.pace * 30).toFixed(4) });
    if (g.stoppedDay)
      fund("WithdrawalEvent", g.stoppedDay - 2, {
        deposit: (g.pace * 4).toFixed(4),
        reserve: "1",
      });
  }
  return out;
})();

function roundAt(ts) {
  let r = f.protocol.currentRound;
  while (
    r > 0 &&
    f.roundByNum.get(r) &&
    f.roundByNum.get(r).startTimestamp > ts
  )
    r--;
  return r;
}

// One batch redemption: 70 tickets for orchestrator B in a single
// transaction, more than a page, to exercise paging through a timestamp.
{
  const g = gateways[2];
  const ts = Math.floor(f.now - 3 * 3600);
  const tx = "0x" + "ba7c".repeat(16);
  for (let k = 0; k < 70; k++)
    g.tickets.push({
      id: `${tx}-${String(k).padStart(3, "0")}`,
      __typename: "WinningTicketRedeemedEvent",
      round: roundAt(ts),
      timestamp: ts,
      tx,
      from: f.demo.B,
      delegate: f.demo.B,
      gateway: g.id,
      amount: "0.01500000",
    });
}

const gatewayById = new Map(gateways.map((g) => [g.id, g]));
const gatewayTickets = gateways.flatMap((g) => g.tickets);
console.log(
  `[mock] gateways=${gateways.length} tickets=${gatewayTickets.length} demo gateway=${GATEWAY_DEMO} self-redeeming=${gateways[1].id}`
);

function shapeGateway(g, days) {
  return {
    id: g.id,
    deposit: g.deposit.toFixed(6),
    reserve: g.reserve.toFixed(6),
    thirtyDayVolumeETH: g.thirty.toFixed(8),
    ninetyDayVolumeETH: g.ninety.toFixed(8),
    totalVolumeETH: g.total.toFixed(8),
    firstActiveDay: g.days[0]?.date ?? 0,
    lastActiveDay: g.days[g.days.length - 1]?.date ?? 0,
    broadcasterDays: [...g.days]
      .reverse()
      .slice(0, days)
      .map((d) => ({ date: d.date, volumeETH: d.volumeETH.toFixed(8) })),
  };
}

/* ── Safe Client Gateway: the "Cold storage" wallet is a 2-of-3 Safe ───── */

// Livepeer's Arbitrum contracts, also served by the fake RPC in
// screenshot.mjs so the app's Controller lookups resolve.
export const CONTRACTS = {
  BondingManager: "0x35bcf3c30594191d53231e4ff333e8a770453e40",
  LivepeerToken: "0x289ba1701c2f088cf0faf8b3705246331cb8a839",
  LivepeerGovernor: "0xcfe4e2879b786c3aa075813f0e364bb5accb6aa0",
  Treasury: "0xf82c1ff415f1fcf582554fdba790e27019c8e8c4",
};
const MULTI_SEND = "0x40a2accbd92bca938b02010e17a5b8929b49130d";
const fn = (name, inputs) => ({
  type: "function",
  name,
  stateMutability: "nonpayable",
  inputs: inputs.map(([type, n]) => ({ type, name: n })),
  outputs: [],
});
const ABI = {
  approve: fn("approve", [
    ["address", "spender"],
    ["uint256", "amount"],
  ]),
  transfer: fn("transfer", [
    ["address", "to"],
    ["uint256", "amount"],
  ]),
  bondWithHint: fn("bondWithHint", [
    ["uint256", "amount"],
    ["address", "to"],
    ["address", "a"],
    ["address", "b"],
    ["address", "c"],
    ["address", "d"],
  ]),
  castVote: fn("castVote", [
    ["uint256", "proposalId"],
    ["uint8", "support"],
  ]),
  multiSend: fn("multiSend", [["bytes", "transactions"]]),
};
const call = (abi, args) =>
  encodeFunctionData({ abi: [abi], functionName: abi.name, args });
const multiSend = (calls) =>
  call(ABI.multiSend, [
    concat(
      calls.map((c) =>
        encodePacked(
          ["uint8", "address", "uint256", "uint256", "bytes"],
          [0, c.to, 0n, BigInt(size(c.data)), c.data]
        )
      )
    ),
  ]);

const ZERO = "0x0000000000000000000000000000000000000000";
const SAFE = f.demo.watched;
const lpt = (n) => BigInt(n) * 10n ** 18n;
const safeTxs = [
  {
    id: `multisig_${getAddress(SAFE)}_0x${"a1".repeat(32)}`,
    nonce: 41,
    confirmations: 1,
    to: MULTI_SEND,
    data: multiSend([
      {
        to: CONTRACTS.LivepeerToken,
        data: call(ABI.approve, [CONTRACTS.BondingManager, lpt(5000)]),
      },
      {
        to: CONTRACTS.BondingManager,
        data: call(ABI.bondWithHint, [
          lpt(5000),
          f.demo.B,
          ZERO,
          ZERO,
          ZERO,
          ZERO,
        ]),
      },
    ]),
  },
  {
    id: `multisig_${getAddress(SAFE)}_0x${"b2".repeat(32)}`,
    nonce: 42,
    confirmations: 2,
    to: CONTRACTS.LivepeerGovernor,
    data: call(ABI.castVote, [BigInt(f.treasuryProposals[0].id), 1]),
  },
  {
    // Not a Livepeer action: the explorer leaves it out.
    id: `multisig_${getAddress(SAFE)}_0x${"c3".repeat(32)}`,
    nonce: 43,
    confirmations: 0,
    to: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    data: call(ABI.transfer, [f.demo.wallet, 1_000_000n]),
  },
];

/** Answers the two gateway endpoints the explorer reads. */
function safeGateway(path) {
  const queued =
    /^\/safe\/v1\/chains\/42161\/safes\/(0x[0-9a-fA-F]{40})\/transactions\/queued$/.exec(
      path
    );
  if (queued) {
    if (queued[1].toLowerCase() !== SAFE)
      return [404, { code: 404, message: "Safe not found" }];
    return [
      200,
      {
        count: safeTxs.length,
        next: null,
        previous: null,
        results: [
          { type: "LABEL", label: "Next" },
          ...safeTxs.map((t) => ({
            type: "TRANSACTION",
            conflictType: "None",
            transaction: {
              id: t.id,
              txStatus:
                t.confirmations >= 2
                  ? "AWAITING_EXECUTION"
                  : "AWAITING_CONFIRMATIONS",
              executionInfo: {
                type: "MULTISIG",
                nonce: t.nonce,
                confirmationsRequired: 2,
                confirmationsSubmitted: t.confirmations,
              },
            },
          })),
        ],
      },
    ];
  }
  const detail = /^\/safe\/v1\/chains\/42161\/transactions\/(.+)$/.exec(path);
  if (detail) {
    const t = safeTxs.find((x) => x.id === decodeURIComponent(detail[1]));
    if (!t) return [404, { code: 404, message: "Not found" }];
    return [
      200,
      {
        txId: t.id,
        txData: { hexData: t.data, to: { value: getAddress(t.to) } },
      },
    ];
  }
  return null;
}

/** Controller.getContract(keccak256(name)) → address, for the fake RPC. */
export const CONTRACT_BY_HASH = Object.fromEntries(
  Object.entries(CONTRACTS).map(([name, addr]) => [
    keccak256(toBytes(name)),
    addr,
  ])
);

/* ── Live events: a trickle of new transactions while the mock runs ──────── */

const live = [];
let liveSeq = 0;
const liveRnd = seeded(`live-${SEED}`);
const livePick = (xs) => xs[Math.floor(liveRnd() * xs.length)];
const liveHex = (n) => hex(liveRnd, n);

/** One new protocol transaction, weighted towards what's most frequent. */
function liveEvent(ts) {
  const active = f.transcoders.filter((t) => t.active);
  const delegators = [...f.delegators.values()];
  const r = liveRnd();
  const tx = "0x" + liveHex(64);
  const base = {
    id: `${tx}-${liveSeq++}`,
    round: f.protocol.currentRound,
    timestamp: ts,
    tx,
  };
  if (r < 0.62) {
    const payers = gateways.filter((g) => !g.stoppedDay);
    const g = payers[Math.floor(liveRnd() ** 2 * payers.length)];
    const o = livePick(g.peers);
    return {
      ...base,
      __typename: "WinningTicketRedeemedEvent",
      from: o.id,
      delegate: o.id,
      gateway: g.id,
      amount: (0.004 + liveRnd() * 0.05).toFixed(6),
    };
  }
  if (r < 0.65) {
    const g = livePick(gateways.filter((x) => !x.stoppedDay));
    return {
      ...base,
      __typename: "DepositFundedEvent",
      from: g.id,
      gateway: g.id,
      amount: (g.pace * 30).toFixed(4),
    };
  }
  if (r < 0.8) {
    const o = livePick(active);
    return {
      ...base,
      __typename: "RewardEvent",
      from: o.id,
      delegate: o.id,
      rewardTokens: (40 + liveRnd() * 900).toFixed(4),
    };
  }
  if (r < 0.9) {
    const d = livePick(delegators);
    const o = livePick(active);
    return {
      ...base,
      __typename: "BondEvent",
      from: d.id,
      delegator: d.id,
      newDelegate: o.id,
      oldDelegate: o.id,
      additionalAmount: (5 + liveRnd() * 2400).toFixed(4),
    };
  }
  if (r < 0.95) {
    const p = f.polls[0];
    const o = livePick(active);
    return {
      ...base,
      __typename: "VoteEvent",
      from: o.id,
      delegator: o.id,
      choiceID: liveRnd() < 0.85 ? "0" : "1",
      poll: p.id,
    };
  }
  const p = f.treasuryProposals[0];
  const o = livePick(active);
  return {
    ...base,
    __typename: "TreasuryVoteEvent",
    from: o.id,
    delegator: o.id,
    support: livePick(["For", "For", "For", "Against", "Abstain"]),
    amount: (Number(o.totalStake) * 0.9).toFixed(4),
    proposal: p.id,
  };
}

{
  // Backfill the last couple of hours, then keep adding every few seconds.
  const now = Math.floor(Date.now() / 1000);
  for (let i = 40; i > 0; i--)
    live.push(liveEvent(now - Math.floor(i * 180 * (0.6 + liveRnd() * 0.8))));
  live.push({
    id: `newround-${f.protocol.currentRound}`,
    __typename: "NewRoundEvent",
    round: f.protocol.currentRound,
    timestamp: f.roundByNum.get(f.protocol.currentRound).startTimestamp,
    tx: "0x" + liveHex(64),
    from: f.transcoders[0].id,
  });
  setInterval(
    () => live.push(liveEvent(Math.floor(Date.now() / 1000))),
    Number(process.env.MOCK_LIVE_MS ?? 7000)
  ).unref();
}

/* ── Feed paging helpers ─────────────────────────────────────────────────── */

const allEvents = () => [
  ...live,
  ...f.transactions.flatMap((t) => t.events),
  ...gatewayTickets,
  ...gateways.flatMap((g) => g.funding),
];
// The subgraph breaks timestamp ties by id, which `skip` relies on.
const newestFirst = (a, b) =>
  b.timestamp - a.timestamp || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const ADDRESS_FIELDS = [
  "delegator",
  "delegate",
  "newDelegate",
  "oldDelegate",
  "gateway",
];

function collectionsFromQuery(query, id) {
  const who = id ? String(id).toLowerCase() : null;
  const out = {};
  const re =
    /(\w+Events)\(first: (\d+)(?:, skip: (\d+))?[^)]*?timestamp_(lte|gt): (\d+)/g;
  for (const [, c, first, skip, op, at] of query.matchAll(re)) {
    const bound = Number(at);
    out[c] = allEvents()
      .filter(
        (e) => e.__typename[0].toLowerCase() + e.__typename.slice(1) + "s" === c
      )
      .filter((e) =>
        op === "lte" ? e.timestamp <= bound : e.timestamp > bound
      )
      .filter(
        (e) =>
          !who ||
          ADDRESS_FIELDS.some((r) => String(e[r] ?? "").toLowerCase() === who)
      )
      .sort(newestFirst)
      .slice(Number(skip ?? 0), Number(skip ?? 0) + Number(first))
      .map(shapeEvent);
  }
  return out;
}

function transactionsPage(keep, first, skip) {
  const byTx = new Map();
  for (const e of allEvents()) {
    const t = byTx.get(e.tx) ?? {
      id: e.tx,
      timestamp: e.timestamp,
      events: [],
    };
    t.events.push(e);
    byTx.set(e.tx, t);
  }
  return {
    transactions: [...byTx.values()]
      .filter(keep)
      .sort(newestFirst)
      .slice(skip, skip + first)
      .map((t) => ({
        id: t.id,
        timestamp: t.timestamp,
        events: t.events.map(shapeEvent),
      })),
  };
}

const resolvers = {
  Delegators: ({ ids }) => ({
    protocol: { currentRound: { id: String(f.protocol.currentRound) } },
    delegators: lower(ids)
      .map((id) => f.delegators.get(id))
      .filter(Boolean)
      .map(shapeDelegator),
  }),

  Snapshots: ({ ids, first, lastId }) => {
    const set = new Set(lower(ids));
    return {
      delegatorSnapshots: page(
        f.snapshots.filter((s) => set.has(s.delegator)),
        { first, lastId }
      ).map((s) => ({
        id: s.id,
        delegator: { id: s.delegator },
        delegate: ref(s.delegate),
        round: { id: String(s.round) },
        shares: s.shares,
        timestamp: s.timestamp,
      })),
    };
  },

  Pools: ({ delegate, first, lastId }) => ({
    pools: page(f.pools.get(String(delegate).toLowerCase()) ?? [], {
      first,
      lastId,
    }).map((p) => shapePool(p, false)),
  }),

  // One reward call per called pool, a few hours into its round.
  RewardTimes: ({ delegates, first, lastId }) => ({
    rewardEvents: page(
      lower(delegates).flatMap((d) =>
        (f.pools.get(d) ?? [])
          .filter((p) => p.rewardTokens != null)
          .map((p) => ({
            id: `${p.id}-reward`,
            timestamp:
              f.roundByNum.get(p.round).startTimestamp +
              3600 * (1 + (p.round % 7)) +
              60 * (p.round % 53),
            round: { id: String(p.round) },
            delegate: { id: d },
          }))
      ),
      { first, lastId }
    ),
  }),

  OrchestratorPools: ({ delegate, first, lastId }) => ({
    pools: page(f.pools.get(String(delegate).toLowerCase()) ?? [], {
      first,
      lastId,
    }).map((p) => shapePool(p, true)),
  }),

  Rounds: ({ since, first, lastId }) => ({
    rounds: page(
      f.rounds.filter((r) => r.startTimestamp >= Number(since ?? 0)),
      { first, lastId }
    ).map((r) => ({
      id: r.id,
      startTimestamp: r.startTimestamp,
      totalActiveStake: r.totalActiveStake,
    })),
  }),

  IndexedBlock: () => ({ _meta: { block: { number: 2 ** 31 } } }),
  Protocol: () => {
    const cur = f.roundByNum.get(f.protocol.currentRound);
    const rest = { ...f.protocol };
    delete rest.currentRound;
    delete rest.lastInitializedRound;
    return {
      protocol: {
        currentRound: { id: cur.id, startTimestamp: cur.startTimestamp },
        lastInitializedRound: { id: String(f.protocol.lastInitializedRound) },
        ...rest,
      },
      rounds: [...f.rounds]
        .sort((a, b) => Number(b.startBlock) - Number(a.startBlock))
        .slice(0, 31)
        .map((r) => ({
          id: r.id,
          startBlock: r.startBlock,
          startTimestamp: r.startTimestamp,
          mintableTokens: r.mintableTokens,
          volumeETH: r.volumeETH,
        })),
    };
  },

  Days: ({ first = 100 }) => ({
    days: [...f.days]
      .sort((a, b) => b.date - a.date)
      .slice(0, first)
      .map(
        ({
          date,
          volumeETH,
          volumeUSD,
          participationRate,
          inflation,
          totalActiveStake,
          delegatorsCount,
          activeTranscoderCount,
        }) => ({
          date,
          volumeETH,
          volumeUSD,
          participationRate,
          inflation,
          totalActiveStake,
          delegatorsCount,
          activeTranscoderCount,
        })
      ),
  }),

  Orchestrators: ({ windowStart = 0, round }) => ({
    transcoders: f.transcoders
      .filter(
        (t) =>
          BigInt(t.activationRound) <= BigInt(round) &&
          BigInt(round) < BigInt(t.deactivationRound)
      )
      .sort((a, b) => Number(b.totalStake) - Number(a.totalStake))
      .slice(0, 200)
      .map((t) => shapeTranscoder(t, Number(windowStart), false)),
  }),

  Orchestrator: ({ id, windowStart = 0 }) => {
    const key = String(id).toLowerCase();
    const t = transcoderById.get(key);
    return {
      transcoder: t ? shapeTranscoder(t, Number(windowStart), true) : null,
    };
  },

  OrchestratorDelegators: ({ delegate, first, lastId }) => ({
    delegators: page(
      (delegatorsByDelegate.get(String(delegate).toLowerCase()) ?? []).filter(
        (d) => Number(d.bondedAmount) > 0
      ),
      { first, lastId }
    ).map((d) => ({
      id: d.id,
      bondedAmount: d.bondedAmount,
      shares: d.shares,
      startRound: d.startRound,
    })),
  }),

  Gateways: ({ minActiveDay = 0 }) => ({
    broadcasters: gateways
      .filter((g) => g.ninety > 0 || (g.days[0]?.date ?? 0) >= minActiveDay)
      .sort((a, b) => b.ninety - a.ninety)
      .map((g) => shapeGateway(g, 90)),
  }),

  Gateway: ({ id }) => {
    const g = gatewayById.get(String(id).toLowerCase());
    return { broadcaster: g ? shapeGateway(g, 365) : null };
  },

  SelfPaidTickets: ({ ids = [], since = 0, first = 1000, lastId = "" }) => {
    const set = new Set(lower(ids));
    const rows = [...gatewayById.values()]
      .filter((g) => set.has(g.id))
      .flatMap((g) =>
        g.tickets
          .filter((t) => t.timestamp >= since && set.has(t.delegate))
          .map((t) => ({ ...t, sender: g.id }))
      );
    return {
      winningTicketRedeemedEvents: page(rows, { first, lastId }).map((t) => ({
        id: t.id,
        faceValue: t.amount,
        sender: ref(t.sender),
        recipient: ref(t.delegate),
      })),
    };
  },

  GatewayTickets: ({ sender, since = 0, first = 1000, lastId = "" }) => ({
    winningTicketRedeemedEvents: page(
      (gatewayById.get(String(sender).toLowerCase())?.tickets ?? []).filter(
        (t) => t.timestamp >= since
      ),
      { first, lastId }
    ).map((t) => ({
      id: t.id,
      timestamp: t.timestamp,
      faceValue: t.amount,
      recipient: ref(t.delegate),
    })),
  }),

  GatewayEvents: ({ id, first = 50 }) => {
    const g = gatewayById.get(String(id).toLowerCase());
    const mine = [
      ...(g?.tickets ?? []),
      ...(g?.funding ?? []),
      ...live.filter((e) => e.gateway === g?.id),
    ].sort((a, b) => b.timestamp - a.timestamp);
    const of = (t) =>
      mine
        .filter((e) => e.__typename === t)
        .slice(0, first)
        .map(shapeEvent);
    return {
      deposits: of("DepositFundedEvent"),
      reserves: of("ReserveFundedEvent"),
      withdrawals: of("WithdrawalEvent"),
    };
  },

  // Collection queries carry their bounds inline, per collection:
  // `xEvents(first: N, skip: S, ... timestamp_lte: T ...)` or
  // `timestamp_gt: T` for the live head; with $id, only that address.
  AddressEvents: (vars, query) => collectionsFromQuery(query, vars.id),
  FeedCollections: (_, query) => collectionsFromQuery(query),
  FeedCollectionsSince: (_, query) => collectionsFromQuery(query),

  FeedTransactions: ({ first = 50, skip = 0, before }) =>
    transactionsPage((t) => t.timestamp <= before, first, skip),
  FeedTransactionsSince: (_, query) => {
    const after = Number(/timestamp_gt: (\d+)/.exec(query)?.[1] ?? 0);
    return transactionsPage((t) => t.timestamp > after, 100, 0);
  },

  TransactionEvents: ({ id }) => {
    const hash = String(id).toLowerCase();
    const events = [
      ...live,
      ...f.transactions.flatMap((t) => t.events),
      ...gatewayTickets,
      ...gateways.flatMap((g) => g.funding),
    ].filter((e) => String(e.tx).toLowerCase() === hash);
    return {
      transaction: events.length ? { events: events.map(shapeEvent) } : null,
    };
  },

  Events: ({ first = 100 }) => ({
    transactions: [
      ...live.map((e) => ({ timestamp: e.timestamp, events: [e] })),
      ...f.transactions,
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, first)
      .map((t) => ({ events: t.events.map(shapeEvent) })),
  }),

  // Current round: orchestrators call reward over the first part of the
  // round, so how many have called depends on how far in we are.
  RewardProgress: ({ round }) => {
    const r = Number(round);
    const cur = f.protocol.currentRound;
    const start = f.roundByNum.get(cur).startTimestamp;
    const elapsed = (Date.now() / 1000 - start) / ROUND_SECONDS;
    return {
      pools: f.transcoders
        .filter((t) => t.active)
        .map((t) => {
          const p = (f.pools.get(t.id) ?? []).find((x) => x.round === r);
          const due = seeded(`${t.id}-${r}`)() * 0.55;
          const called = r < cur || (elapsed >= due && p?.rewardTokens);
          // Fees accrue through the round as tickets are redeemed.
          const share = r < cur ? 1 : Math.min(1, Math.max(0, elapsed));
          return {
            delegate: { id: t.id },
            rewardTokens: called ? p?.rewardTokens ?? "100" : null,
            fees: (Number(p?.fees ?? 0) * share).toFixed(8),
          };
        }),
    };
  },

  AccountEvents: ({ ids, first = 50 }) => {
    const set = new Set(lower(ids));
    const of = (type) =>
      f.events
        .filter((e) => e.__typename === type && set.has(e.delegator))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, first)
        .map(shapeEvent);
    return {
      bond: of("BondEvent"),
      unbond: of("UnbondEvent"),
      rebond: of("RebondEvent"),
      withdrawStake: of("WithdrawStakeEvent"),
      withdrawFees: of("WithdrawFeesEvent"),
    };
  },

  OrchestratorUpdates: ({ ids, since = 0 }) => {
    const set = new Set(lower(ids));
    return {
      transcoderUpdateEvents: f.events
        .filter(
          (e) =>
            e.__typename === "TranscoderUpdateEvent" &&
            set.has(e.delegate) &&
            e.timestamp >= Number(since)
        )
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 100)
        .map(shapeEvent),
    };
  },

  RoundAtBlock: ({ block }) => ({
    rounds: f.rounds
      .filter((r) => Number(r.startBlock) <= Number(block))
      .sort((a, b) => Number(b.startBlock) - Number(a.startBlock))
      .slice(0, 1)
      .map((r) => ({ id: String(r.id) })),
  }),

  RoundPools: ({ round }) => ({
    pools: f.transcoders
      .filter((t) => t.active)
      .flatMap((t) => {
        const p = (f.pools.get(t.id) ?? []).find(
          (x) => x.round === Number(round)
        );
        return p && Number(p.totalStake) > 0
          ? [{ delegate: { id: t.id }, totalStake: p.totalStake }]
          : [];
      }),
  }),

  VoterDelegates: ({ ids }) => ({
    delegators: lower(ids).flatMap((id) => {
      if (transcoderById.has(id)) return [{ id, delegate: { id } }];
      const d = f.delegators.get(id);
      return d ? [{ id, delegate: ref(d.delegate) }] : [];
    }),
  }),

  PollVotes: ({ poll }) => {
    const p = f.polls.find((x) => x.id === String(poll).toLowerCase());
    const voters = p
      ? mockVoters(p.id, p.votes.length, [
          { key: "Yes", value: Number(p.tally?.yes ?? 0) },
          { key: "No", value: Number(p.tally?.no ?? 0) },
        ])
      : [];
    return {
      votes: voters.map((v) => ({
        voter: v.id,
        voteStake: v.weight.toFixed(8),
        nonVoteStake: "0",
        choiceID: v.choice,
        registeredTranscoder: v.orch,
      })),
      voteEvents: voters.map((v) => ({
        voter: v.id,
        timestamp: v.timestamp,
        transaction: { id: v.tx },
      })),
    };
  },

  ProposalVotes: ({ proposal }) => {
    const p = f.treasuryProposals.find((x) => x.id === String(proposal));
    const voters = p
      ? mockVoters(p.id, Number(p.totalVotes) > 0 ? 48 : 0, [
          { key: "For", value: Number(p.forVotes) },
          { key: "Against", value: Number(p.againstVotes) },
          { key: "Abstain", value: Number(p.abstainVotes) },
        ])
      : [];
    return {
      treasuryVotes: voters.map((v) => ({
        voter: { id: v.id },
        support: v.choice,
        weight: v.weight.toFixed(8),
        reason: v.reason,
      })),
      treasuryVoteEvents: voters.map((v) => ({
        voter: { id: v.id },
        timestamp: v.timestamp,
        transaction: { id: v.tx },
      })),
    };
  },

  Governance: () => ({
    treasuryProposals: [...f.treasuryProposals]
      .sort((a, b) => Number(b.voteStart) - Number(a.voteStart))
      .map(({ proposer, ...p }) => ({ ...p, proposer: { id: proposer } })),
    polls: [...f.polls].sort((a, b) => Number(b.endBlock) - Number(a.endBlock)),
  }),
};

/* ── HTTP ────────────────────────────────────────────────────────────────── */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

const send = (res, status, body) => {
  res.writeHead(status, { ...CORS, "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }
  const url = new URL(req.url, "http://localhost");
  if (req.method === "GET" && url.pathname.startsWith("/coingecko"))
    return send(res, 200, COINGECKO);
  if (req.method === "GET" && url.pathname.startsWith("/safe/")) {
    const hit = safeGateway(url.pathname);
    return hit
      ? send(res, hit[0], hit[1])
      : send(res, 404, { error: "not found" });
  }
  if (req.method === "GET" && url.pathname === "/contracts")
    return send(
      res,
      200,
      url.searchParams.has("names") ? CONTRACTS : CONTRACT_BY_HASH
    );
  if (req.method === "GET" && url.pathname === "/health")
    return send(res, 200, {
      ok: true,
      demo: { ...f.demo, gateway: GATEWAY_DEMO, selfGateway: gateways[1].id },
    });
  if (req.method !== "POST") return send(res, 404, { error: "not found" });

  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return send(res, 400, { errors: [{ message: "mock: invalid JSON" }] });
    }
    const op = /\b(?:query|mutation)\s+(\w+)/.exec(body.query ?? "")?.[1];
    const resolver = op && resolvers[op];
    if (!resolver) {
      console.warn(`[mock] unknown operation: ${op ?? "(anonymous)"}`);
      return send(res, 200, {
        errors: [{ message: `mock: unknown operation ${op ?? "(anonymous)"}` }],
      });
    }
    const t0 = performance.now();
    try {
      const data = resolver(body.variables ?? {}, body.query ?? "");
      if (VERBOSE)
        console.log(
          `[mock] ${op} ${JSON.stringify(body.variables ?? {}).slice(
            0,
            120
          )} ${(performance.now() - t0).toFixed(1)}ms`
        );
      send(res, 200, { data });
    } catch (err) {
      console.error("[mock] %s failed", op, err);
      send(res, 200, {
        errors: [{ message: `mock: ${op} failed: ${err.message}` }],
      });
    }
  });
});

server.listen(PORT, () =>
  console.log(
    `[mock] subgraph on http://localhost:${PORT}/graphql, prices on /coingecko`
  )
);
