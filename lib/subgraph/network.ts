import { getAddress } from "viem";

import { PoolHistory, PRECISE } from "@/lib/portfolio/compute";

import { isActiveInRound } from "./active";
import { paginate, querySubgraph } from "./client";
import { advance, type Cursor, FIRST_CURSOR } from "./paging";
import { toPoolPoint } from "./portfolio";

/* ── Raw subgraph shapes (numbers arrive as strings) ─────────────────────── */

type Ref = { id: string } | null;

type RawProtocol = {
  currentRound: { id: string; startTimestamp: number };
  lastInitializedRound: Ref;
  roundLength: string;
  totalActiveStake: string;
  totalSupply: string;
  participationRate: string;
  inflation: string;
  inflationChange: string;
  targetBondingRate: string;
  numActiveTranscoders: string;
  activeTranscoderCount: string;
  delegatorsCount: string;
  totalVolumeETH: string;
  totalVolumeUSD: string;
  unbondingPeriod: string;
  paused: boolean;
};

type RawRoundRow = {
  id: string;
  startBlock: string;
  startTimestamp: number;
  mintableTokens: string;
  volumeETH: string;
};

type RawDay = {
  date: number;
  volumeETH: string;
  volumeUSD: string;
  participationRate: string;
  inflation: string;
  totalActiveStake: string;
  delegatorsCount: string;
  activeTranscoderCount: string;
};

type RawWindowPool = {
  round: { id: string };
  rewardTokens: string | null;
  /** Reward cut in force that round, ppm */
  rewardCut?: string | null;
  cumulativeRewardFactor: string;
};

type RawTranscoder = {
  id: string;
  activationRound: string;
  deactivationRound: string;
  status: string;
  totalStake: string;
  rewardCut: string;
  feeShare: string;
  rewardCutUpdateTimestamp: number;
  feeShareUpdateTimestamp: number;
  activationTimestamp: number;
  lastRewardRound: Ref;
  thirtyDayVolumeETH: string;
  ninetyDayVolumeETH: string;
  totalVolumeETH: string;
  serviceURI: string | null;
  delegator: { bondedAmount: string } | null;
  delegators: { id: string }[] | null;
  pools: RawWindowPool[] | null;
  lifetimeRewardCommission?: string;
  lifetimeFeeCommission?: string;
};

type RawDetailPool = RawWindowPool & {
  id: string;
  round: { id: string; startTimestamp: number };
  cumulativeFeeFactor: string;
  rewardCut: string;
  feeShare: string;
  totalStake: string;
  fees: string;
};

export type RawEvent = {
  id: string;
  __typename: string;
  round: Ref;
  timestamp: number;
  transaction: { id: string; from: string } | null;
  delegator?: Ref;
  delegate?: Ref;
  newDelegate?: Ref;
  oldDelegate?: Ref;
  oldDelegator?: Ref;
  newDelegator?: Ref;
  additionalAmount?: string;
  amount?: string;
  rewardTokens?: string;
  rewardCut?: string;
  feeShare?: string;
  // Ticket redemptions and gateway funding
  recipient?: Ref;
  faceValue?: string;
  sender?: Ref;
  reserveHolder?: Ref;
  deposit?: string;
  reserve?: string;
  // Votes: aliased, since `voter` and `proposal` differ in type by event
  pollVoter?: string;
  choiceID?: string;
  poll?: Ref;
  treasuryVoter?: Ref;
  support?: string;
  weight?: string;
  treasuryProposal?: Ref;
};

type RawProposal = {
  id: string;
  description: string;
  voteStart: string;
  voteEnd: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  totalVotes: string;
  proposer: { id: string };
};

type RawPoll = {
  id: string;
  proposal: string;
  endBlock: string;
  quorum: string;
  quota: string;
  tally: { yes: string; no: string } | null;
  votes: { id: string }[] | null;
};

/* ── Protocol & round clock ──────────────────────────────────────────────── */

export type Protocol = {
  currentRound: number;
  roundStartTs: number;
  roundLength: number;
  lastInitializedRound: number;
  totalActiveStake: number;
  totalSupply: number;
  participationRate: number;
  /** Per-round inflation, in parts per billion */
  inflation: number;
  inflationChange: number;
  targetBondingRate: number;
  numActiveTranscoders: number;
  activeTranscoderCount: number;
  delegatorsCount: number;
  totalVolumeETH: number;
  totalVolumeUSD: number;
  unbondingPeriod: number;
  paused: boolean;
  /** Seconds per L1 block, measured from recent rounds */
  secondsPerBlock: number;
  /** Nominal round duration, seconds */
  roundSeconds: number;
  recentRounds: {
    round: number;
    ts: number;
    startBlock: number;
    mintableTokens: number;
    volumeETH: number;
  }[];
};

const PROTOCOL = /* GraphQL */ `
  query Protocol {
    protocol(id: "0") {
      currentRound {
        id
        startTimestamp
      }
      lastInitializedRound {
        id
      }
      roundLength
      totalActiveStake
      totalSupply
      participationRate
      inflation
      inflationChange
      targetBondingRate
      numActiveTranscoders
      activeTranscoderCount
      delegatorsCount
      totalVolumeETH
      totalVolumeUSD
      unbondingPeriod
      paused
    }
    rounds(first: 31, orderBy: startBlock, orderDirection: desc) {
      id
      startBlock
      startTimestamp
      mintableTokens
      volumeETH
    }
  }
`;

const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export async function fetchProtocol(): Promise<Protocol> {
  const { protocol: p, rounds } = await querySubgraph<{
    protocol: RawProtocol;
    rounds: RawRoundRow[];
  }>(PROTOCOL);

  const recentRounds = rounds
    .map((r) => ({
      round: Number(r.id),
      ts: Number(r.startTimestamp),
      startBlock: Number(r.startBlock),
      mintableTokens: Number(r.mintableTokens),
      volumeETH: Number(r.volumeETH),
    }))
    .sort((a, b) => a.round - b.round);

  // Rounds are measured in L1 blocks. Calibrate block time from consecutive
  // rounds so a late initialization stretches both sides of the ratio.
  const samples: number[] = [];
  for (let i = 1; i < recentRounds.length; i++) {
    const a = recentRounds[i - 1];
    const b = recentRounds[i];
    if (b.round !== a.round + 1) continue;
    const dt = b.ts - a.ts;
    const db = b.startBlock - a.startBlock;
    if (dt > 0 && db > 0) samples.push(dt / db);
  }
  const secondsPerBlock = Math.min(30, Math.max(6, median(samples) ?? 12));
  const roundLength = Number(p.roundLength);

  return {
    currentRound: Number(p.currentRound.id),
    roundStartTs: Number(p.currentRound.startTimestamp),
    roundLength,
    lastInitializedRound: Number(
      p.lastInitializedRound?.id ?? p.currentRound.id
    ),
    totalActiveStake: Number(p.totalActiveStake),
    totalSupply: Number(p.totalSupply),
    participationRate: Number(p.participationRate) * 100,
    inflation: Number(p.inflation),
    inflationChange: Number(p.inflationChange),
    targetBondingRate: Number(p.targetBondingRate) / 1e7,
    numActiveTranscoders: Number(p.numActiveTranscoders),
    activeTranscoderCount: Number(p.activeTranscoderCount),
    delegatorsCount: Number(p.delegatorsCount),
    totalVolumeETH: Number(p.totalVolumeETH),
    totalVolumeUSD: Number(p.totalVolumeUSD),
    unbondingPeriod: Number(p.unbondingPeriod),
    paused: Boolean(p.paused),
    secondsPerBlock,
    roundSeconds: roundLength * secondsPerBlock,
    recentRounds,
  };
}

/* ── Daily network history ───────────────────────────────────────────────── */

export type Day = {
  date: number;
  volumeETH: number;
  volumeUSD: number;
  participationRate: number;
  inflation: number;
  totalActiveStake: number;
  delegatorsCount: number;
  activeTranscoderCount: number;
};

const DAYS = /* GraphQL */ `
  query Days($first: Int!) {
    days(first: $first, orderBy: date, orderDirection: desc) {
      date
      volumeETH
      volumeUSD
      participationRate
      inflation
      totalActiveStake
      delegatorsCount
      activeTranscoderCount
    }
  }
`;

/** Day fields that are snapshots set when a round starts, never truly zero. */
const SNAPSHOT_FIELDS = [
  "participationRate",
  "inflation",
  "totalActiveStake",
  "delegatorsCount",
  "activeTranscoderCount",
] as const;

/**
 * The subgraph creates a day's entity at its first event with these
 * snapshot fields at zero, and only fills them in when a round starts. Until
 * then (typically today) a zero means "not recorded yet", so carry the
 * previous day's value forward rather than charting a drop to zero. Fee
 * volume is left alone: a day without fees really is zero.
 */
export function fillUnsetDayStats(days: Day[]): Day[] {
  const out: Day[] = [];
  for (const d of days) {
    const prev = out[out.length - 1];
    const next = { ...d };
    if (prev) {
      for (const k of SNAPSHOT_FIELDS) if (!(next[k] > 0)) next[k] = prev[k];
    }
    out.push(next);
  }
  return out;
}

export async function fetchDays(first = 365): Promise<Day[]> {
  const { days } = await querySubgraph<{ days: RawDay[] }>(DAYS, { first });
  const parsed = days
    .map((d) => ({
      date: Number(d.date),
      volumeETH: Number(d.volumeETH),
      volumeUSD: Number(d.volumeUSD),
      participationRate: Number(d.participationRate) * 100,
      inflation: Number(d.inflation) / 1e7,
      totalActiveStake: Number(d.totalActiveStake),
      delegatorsCount: Number(d.delegatorsCount),
      activeTranscoderCount: Number(d.activeTranscoderCount),
    }))
    .sort((a, b) => a.date - b.date);
  return fillUnsetDayStats(parsed);
}

/* ── Orchestrators ───────────────────────────────────────────────────────── */

export type Orchestrator = {
  id: string;
  active: boolean;
  status: string;
  totalStake: number;
  selfStake: number;
  rewardCut: number;
  feeShare: number;
  rewardCutUpdateTimestamp: number;
  feeShareUpdateTimestamp: number;
  activationTimestamp: number;
  lastRewardRound: number | null;
  thirtyDayVolumeETH: number;
  ninetyDayVolumeETH: number;
  totalVolumeETH: number;
  delegatorCount: number;
  serviceURI: string | null;
  /** Reward calls in the trailing window, out of `rewardWindow` rounds */
  rewardCalls: number;
  rewardWindow: number;
  /** Realised delegator yield over the window, annualised (%) */
  realizedApr: number | null;
  /**
   * What a delegator joining now can expect, annualised (%): the realised
   * yield, lowered to what the current reward cut implies when the cut went
   * up during the window.
   */
  forwardApr: number | null;
  /** Rounds of the window it was in the active set for. */
  historyRounds: number;
  /** Lowest reward cut (%) in the window, when below today's: a raise. */
  cutRaisedFrom: number | null;
  /**
   * ETH it paid itself over 90 days, as a gateway sending tickets to its
   * own address. Not demand for its work, so left out of its fee yield.
   */
  selfPaidFees90: number;
};

const TRANSCODER_FIELDS = /* GraphQL */ `
  id
  activationRound
  deactivationRound
  status
  totalStake
  rewardCut
  feeShare
  rewardCutUpdateTimestamp
  feeShareUpdateTimestamp
  activationTimestamp
  lastRewardRound {
    id
  }
  thirtyDayVolumeETH
  ninetyDayVolumeETH
  totalVolumeETH
  serviceURI
  delegator {
    bondedAmount
  }
  delegators(first: 1000) {
    id
  }
`;

const ORCHESTRATORS = /* GraphQL */ `
  query Orchestrators($windowStart: Int!, $round: BigInt!) {
    transcoders(
      where: { activationRound_lte: $round, deactivationRound_gt: $round }
      first: 200
      orderBy: totalStake
      orderDirection: desc
    ) {
      ${TRANSCODER_FIELDS}
      pools(first: 60, orderBy: id, orderDirection: desc, where: { round_: { startTimestamp_gte: $windowStart } }) {
        round {
          id
        }
        rewardTokens
        rewardCut
        cumulativeRewardFactor
      }
    }
  }
`;

const WINDOW = 30;

/** Start timestamp a little before the trailing reward window. */
const windowStart = (p: Protocol) =>
  Math.floor(p.roundStartTs - (WINDOW + 2) * p.roundSeconds);

export function rewardStats(
  pools: RawWindowPool[],
  currentRound: number,
  roundSeconds: number,
  /** Today's reward cut, % */
  rewardCut: number
) {
  // Completed rounds only: the current one may still get its call.
  const window = pools
    .map((p) => ({
      round: Number(p.round.id),
      called: p.rewardTokens != null,
      cut: p.rewardCut != null ? Number(p.rewardCut) / 1e4 : null,
      crf: BigInt(p.cumulativeRewardFactor),
    }))
    .filter((p) => p.round < currentRound && p.round >= currentRound - WINDOW)
    .sort((a, b) => a.round - b.round);

  const rewardCalls = window.filter((p) => p.called).length;
  const roundsPerYear = (365 * 86400) / roundSeconds;
  const annualise = (perRound: number) =>
    (Math.pow(1 + perRound, roundsPerYear) - 1) * 100;

  let realizedApr: number | null = null;
  let forwardApr: number | null = null;
  if (window.length >= 2) {
    const first = window[0];
    const last = window[window.length - 1];
    const span = last.round - first.round;
    if (first.crf > 0n && span > 0) {
      const growth = Number((last.crf * 10n ** 12n) / first.crf) / 1e12;
      const perRound = Math.pow(growth, 1 / span) - 1;
      realizedApr = annualise(perRound);
      // Rewards each round are the same per LPT everywhere, less the cut
      // then in force: rescale the realised yield from the window's average
      // cut to today's. Only ever lowers it: a lowered cut
      // counts once it has actually paid out.
      const cuts = window
        .slice(1)
        .filter((p) => p.called && p.cut != null)
        .map((p) => p.cut!);
      const meanCut = cuts.length
        ? cuts.reduce((a, b) => a + b, 0) / cuts.length
        : rewardCut;
      const kept = 1 - meanCut / 100;
      const scaled =
        kept > 0.001 ? (perRound * (1 - rewardCut / 100)) / kept : 0;
      forwardApr = Math.min(realizedApr, annualise(scaled));
    }
  }
  const cuts = window.map((p) => p.cut).filter((c): c is number => c != null);
  const lowest = cuts.length ? Math.min(...cuts) : null;
  return {
    rewardCalls,
    rewardWindow: Math.min(WINDOW, window.length || WINDOW),
    realizedApr,
    forwardApr,
    historyRounds: window.length,
    cutRaisedFrom: lowest != null && lowest < rewardCut ? lowest : null,
  };
}

function toOrchestrator(
  t: RawTranscoder,
  currentRound: number,
  roundSeconds: number
): Orchestrator {
  return {
    id: t.id,
    active: isActiveInRound(
      t.activationRound,
      t.deactivationRound,
      currentRound
    ),
    status: t.status,
    totalStake: Number(t.totalStake),
    selfStake: Number(t.delegator?.bondedAmount ?? 0),
    rewardCut: Number(t.rewardCut) / 1e4,
    feeShare: Number(t.feeShare) / 1e4,
    rewardCutUpdateTimestamp: Number(t.rewardCutUpdateTimestamp),
    feeShareUpdateTimestamp: Number(t.feeShareUpdateTimestamp),
    activationTimestamp: Number(t.activationTimestamp),
    lastRewardRound: t.lastRewardRound ? Number(t.lastRewardRound.id) : null,
    thirtyDayVolumeETH: Number(t.thirtyDayVolumeETH),
    ninetyDayVolumeETH: Number(t.ninetyDayVolumeETH),
    totalVolumeETH: Number(t.totalVolumeETH),
    delegatorCount: t.delegators?.length ?? 0,
    serviceURI: t.serviceURI ?? null,
    selfPaidFees90: 0,
    ...rewardStats(
      t.pools ?? [],
      currentRound,
      roundSeconds,
      Number(t.rewardCut) / 1e4
    ),
  };
}

/** Tickets between orchestrator addresses: where self-payment shows up. */
const SELF_PAID_TICKETS = /* GraphQL */ `
  query SelfPaidTickets(
    $ids: [String!]!
    $since: Int!
    $first: Int!
    $lastId: String!
  ) {
    winningTicketRedeemedEvents(
      first: $first
      orderBy: id
      where: {
        sender_in: $ids
        recipient_in: $ids
        timestamp_gte: $since
        id_gt: $lastId
      }
    ) {
      id
      faceValue
      sender {
        id
      }
      recipient {
        id
      }
    }
  }
`;

type RawSelfTicket = {
  id: string;
  faceValue: string;
  sender: Ref;
  recipient: Ref;
};

/** ETH each address paid itself: tickets whose sender is the recipient. */
export function selfPaid(rows: RawSelfTicket[]) {
  const out = new Map<string, number>();
  for (const t of rows) {
    const from = t.sender?.id;
    if (!from || from !== t.recipient?.id) continue;
    out.set(from, (out.get(from) ?? 0) + Number(t.faceValue));
  }
  return out;
}

export async function fetchOrchestrators(
  protocol: Protocol
): Promise<Orchestrator[]> {
  const { transcoders } = await querySubgraph<{ transcoders: RawTranscoder[] }>(
    ORCHESTRATORS,
    {
      windowStart: windowStart(protocol),
      round: String(protocol.currentRound),
    }
  );
  // Best effort: without it, fee yields just include self-payment.
  const self = await paginate<RawSelfTicket>(
    SELF_PAID_TICKETS,
    "winningTicketRedeemedEvents",
    {
      ids: transcoders.map((t) => t.id),
      since: Math.floor(Date.now() / 1000) - 90 * 86400,
    },
    { max: 10_000 }
  )
    .then(selfPaid)
    .catch(() => new Map<string, number>());
  return transcoders.map((t) => ({
    ...toOrchestrator(t, protocol.currentRound, protocol.roundSeconds),
    selfPaidFees90: self.get(t.id) ?? 0,
  }));
}

/* ── One orchestrator ────────────────────────────────────────────────────── */

export type OrchestratorDetail = Orchestrator & {
  pools: {
    round: number;
    ts: number;
    rewardTokens: number | null;
    totalStake: number;
    fees: number;
    rewardCut: number;
    feeShare: number;
    /** Delegator yield that round, % */
    yieldPct: number | null;
  }[];
  delegatorList: { id: string; bondedAmount: number; startRound: number }[];
  lifetimeRewardCommission: number;
  lifetimeFeeCommission: number;
};

const ORCHESTRATOR = /* GraphQL */ `
  query Orchestrator($id: ID!, $windowStart: Int!) {
    transcoder(id: $id) {
      ${TRANSCODER_FIELDS}
      lifetimeRewardCommission
      lifetimeFeeCommission
      pools(first: 60, orderBy: id, orderDirection: desc, where: { round_: { startTimestamp_gte: $windowStart } }) {
        round {
          id
        }
        rewardTokens
        rewardCut
        cumulativeRewardFactor
      }
    }
  }
`;

type RawDelegatorRow = {
  id: string;
  bondedAmount: string;
  shares: string;
  startRound: string;
};

/** Every delegator with stake, walked by id: an orchestrator can have more
 * than a single query returns. */
const ORCHESTRATOR_DELEGATORS = /* GraphQL */ `
  query OrchestratorDelegators(
    $delegate: String!
    $first: Int!
    $lastId: String!
  ) {
    delegators(
      where: { delegate: $delegate, bondedAmount_gt: "0", id_gt: $lastId }
      first: $first
      orderBy: id
    ) {
      id
      bondedAmount
      shares
      startRound
    }
  }
`;

const ORCHESTRATOR_POOLS = /* GraphQL */ `
  query OrchestratorPools($delegate: String!, $first: Int!, $lastId: String!) {
    pools(
      where: { delegate: $delegate, id_gt: $lastId }
      first: $first
      orderBy: id
    ) {
      id
      round {
        id
        startTimestamp
      }
      cumulativeRewardFactor
      cumulativeFeeFactor
      rewardTokens
      rewardCut
      feeShare
      totalStake
      fees
    }
  }
`;

/** One orchestrator's list-level stats, without its full history. */
export async function fetchOrchestratorSummary(
  id: string,
  protocol: Protocol
): Promise<Orchestrator | null> {
  const { transcoder } = await querySubgraph<{
    transcoder: RawTranscoder | null;
  }>(ORCHESTRATOR, {
    id: id.toLowerCase(),
    windowStart: windowStart(protocol),
  });
  return transcoder
    ? toOrchestrator(transcoder, protocol.currentRound, protocol.roundSeconds)
    : null;
}

export async function fetchOrchestrator(
  id: string,
  protocol: Protocol
): Promise<OrchestratorDetail | null> {
  const address = id.toLowerCase();
  const [data, rawPools, delegators] = await Promise.all([
    querySubgraph<{ transcoder: RawTranscoder | null }>(ORCHESTRATOR, {
      id: address,
      windowStart: windowStart(protocol),
    }),
    paginate<RawDetailPool>(ORCHESTRATOR_POOLS, "pools", { delegate: address }),
    paginate<RawDelegatorRow>(ORCHESTRATOR_DELEGATORS, "delegators", {
      delegate: address,
    }),
  ]);
  if (!data.transcoder) return null;

  const history = new PoolHistory(rawPools.map(toPoolPoint));
  const latestCrf = history.latest()?.crf ?? 0n;
  const pools = rawPools
    .map((p) => {
      const round = Number(p.round.id);
      const crf = history.at(round)?.crf ?? 0n;
      const prev = history.at(round - 1)?.crf ?? 0n;
      const yieldPct =
        prev > 0n
          ? (Number(((crf - prev) * 10n ** 12n) / prev) / 1e12) * 100
          : null;
      return {
        round,
        ts: Number(p.round.startTimestamp),
        rewardTokens: p.rewardTokens == null ? null : Number(p.rewardTokens),
        totalStake: Number(p.totalStake),
        fees: Number(p.fees),
        rewardCut: Number(p.rewardCut) / 1e4,
        feeShare: Number(p.feeShare) / 1e4,
        yieldPct,
      };
    })
    .sort((a, b) => a.round - b.round);

  return {
    ...toOrchestrator(
      data.transcoder,
      protocol.currentRound,
      protocol.roundSeconds
    ),
    pools,
    delegatorCount: delegators.length,
    // Current stake is shares at the latest factor; `bondedAmount` is only
    // as fresh as each delegator's last claim.
    delegatorList: delegators
      .map((d) => {
        const shares = BigInt(d.shares || "0");
        const stake =
          latestCrf > 0n && shares > 0n
            ? Number((shares * latestCrf) / PRECISE) / 1e18
            : Number(d.bondedAmount);
        return {
          id: d.id,
          bondedAmount: stake,
          startRound: Number(d.startRound),
        };
      })
      .sort((a, b) => b.bondedAmount - a.bondedAmount),
    lifetimeRewardCommission:
      Number(data.transcoder.lifetimeRewardCommission) / 1e18,
    lifetimeFeeCommission: Number(data.transcoder.lifetimeFeeCommission) / 1e18,
  };
}

/* ── Activity ────────────────────────────────────────────────────────────── */

export type ActivityEvent = {
  id: string;
  type: string;
  round: number;
  timestamp: number;
  tx: string;
  from: string;
  delegator?: string;
  delegate?: string;
  oldDelegate?: string;
  /** The gateway that paid a ticket, or funded or withdrew its deposit. */
  gateway?: string;
  amount?: number;
  rewardCut?: number;
  feeShare?: number;
  /** Votes: the choice as shown (Yes/No, For/Against/Abstain). */
  choice?: string;
  /** Poll address or treasury proposal id a vote or poll refers to. */
  poll?: string;
  proposal?: string;
};

const EVENT_FIELDS = /* GraphQL */ `
  id
  __typename
  round {
    id
  }
  timestamp
  transaction {
    id
    from
  }
  ... on BondEvent {
    delegator {
      id
    }
    newDelegate {
      id
    }
    oldDelegate {
      id
    }
    additionalAmount
  }
  ... on UnbondEvent {
    delegate {
      id
    }
    delegator {
      id
    }
    amount
  }
  ... on RebondEvent {
    delegate {
      id
    }
    delegator {
      id
    }
    amount
  }
  ... on TranscoderUpdateEvent {
    delegate {
      id
    }
    rewardCut
    feeShare
  }
  ... on RewardEvent {
    delegate {
      id
    }
    rewardTokens
  }
  ... on WithdrawStakeEvent {
    delegator {
      id
    }
    amount
  }
  ... on WithdrawFeesEvent {
    delegator {
      id
    }
    amount
  }
  ... on TransferBondEvent {
    oldDelegator {
      id
    }
    newDelegator {
      id
    }
    amount
  }
  ... on TranscoderActivatedEvent {
    delegate {
      id
    }
  }
  ... on TranscoderDeactivatedEvent {
    delegate {
      id
    }
  }
  ... on WinningTicketRedeemedEvent {
    recipient {
      id
    }
    sender {
      id
    }
    faceValue
  }
  ... on DepositFundedEvent {
    sender {
      id
    }
    amount
  }
  ... on ReserveFundedEvent {
    reserveHolder {
      id
    }
    amount
  }
  ... on WithdrawalEvent {
    sender {
      id
    }
    deposit
    reserve
  }
  ... on VoteEvent {
    pollVoter: voter
    choiceID
    poll {
      id
    }
  }
  ... on TreasuryVoteEvent {
    treasuryVoter: voter {
      id
    }
    support
    weight
    treasuryProposal: proposal {
      id
    }
  }
  ... on PollCreatedEvent {
    poll {
      id
    }
  }
`;

function toEvent(e: RawEvent): ActivityEvent {
  const amount =
    e.additionalAmount ??
    e.amount ??
    e.rewardTokens ??
    e.faceValue ??
    e.weight ??
    (e.deposit != null
      ? String(Number(e.deposit) + Number(e.reserve ?? 0))
      : undefined);
  return {
    id: e.id,
    type: e.__typename.replace(/Event$/, ""),
    round: Number(e.round?.id ?? 0),
    timestamp: Number(e.timestamp),
    tx: e.transaction?.id ?? "",
    from: e.transaction?.from ?? "",
    delegator:
      e.delegator?.id ??
      e.oldDelegator?.id ??
      e.pollVoter?.toLowerCase() ??
      e.treasuryVoter?.id,
    delegate:
      e.newDelegate?.id ??
      e.delegate?.id ??
      e.newDelegator?.id ??
      e.recipient?.id,
    oldDelegate: e.oldDelegate?.id,
    gateway: e.sender?.id ?? e.reserveHolder?.id,
    amount: amount != null ? Number(amount) : undefined,
    rewardCut: e.rewardCut != null ? Number(e.rewardCut) / 1e4 : undefined,
    feeShare: e.feeShare != null ? Number(e.feeShare) / 1e4 : undefined,
    choice:
      e.choiceID != null
        ? e.choiceID === "0"
          ? "Yes"
          : "No"
        : e.support ?? undefined,
    poll: e.poll?.id,
    proposal: e.treasuryProposal?.id,
  };
}

const EVENT_TYPES = [
  "BondEvent",
  "UnbondEvent",
  "RebondEvent",
  "TranscoderUpdateEvent",
  "RewardEvent",
  "WithdrawStakeEvent",
  "WithdrawFeesEvent",
  "TransferBondEvent",
  "TranscoderActivatedEvent",
  "TranscoderDeactivatedEvent",
  "WinningTicketRedeemedEvent",
  "DepositFundedEvent",
  "ReserveFundedEvent",
  "WithdrawalEvent",
  "NewRoundEvent",
  "VoteEvent",
  "TreasuryVoteEvent",
  "PollCreatedEvent",
];

const EVENTS = /* GraphQL */ `
  query Events($first: Int!) {
    transactions(first: $first, orderBy: timestamp, orderDirection: desc) {
      events {
        ${EVENT_FIELDS}
      }
    }
  }
`;

export async function fetchEvents(first = 100): Promise<ActivityEvent[]> {
  const { transactions } = await querySubgraph<{
    transactions: { events: RawEvent[] | null }[];
  }>(EVENTS, { first });
  return transactions
    .flatMap((t) => t.events ?? [])
    .filter((e) => EVENT_TYPES.includes(e.__typename))
    .map(toEvent);
}

const ACCOUNT_EVENTS = /* GraphQL */ `
  query AccountEvents($ids: [String!]!, $first: Int!) {
    bond: bondEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { delegator_in: $ids }) { ${EVENT_FIELDS} }
    unbond: unbondEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { delegator_in: $ids }) { ${EVENT_FIELDS} }
    rebond: rebondEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { delegator_in: $ids }) { ${EVENT_FIELDS} }
    withdrawStake: withdrawStakeEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { delegator_in: $ids }) { ${EVENT_FIELDS} }
    withdrawFees: withdrawFeesEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { delegator_in: $ids }) { ${EVENT_FIELDS} }
  }
`;

export async function fetchAccountEvents(
  ids: string[],
  first = 50
): Promise<ActivityEvent[]> {
  const data = await querySubgraph<Record<string, RawEvent[]>>(ACCOUNT_EVENTS, {
    ids: ids.map((i) => i.toLowerCase()),
    first,
  });
  return Object.values(data)
    .flat()
    .map(toEvent)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, first);
}

const GATEWAY_EVENTS = /* GraphQL */ `
  query GatewayEvents($id: String!, $first: Int!) {
    deposits: depositFundedEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { sender: $id }) { ${EVENT_FIELDS} }
    reserves: reserveFundedEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { reserveHolder: $id }) { ${EVENT_FIELDS} }
    withdrawals: withdrawalEvents(first: $first, orderBy: timestamp, orderDirection: desc, where: { sender: $id }) { ${EVENT_FIELDS} }
  }
`;

/** A gateway's deposit and reserve top-ups and withdrawals. */
export async function fetchGatewayEvents(
  id: string,
  first = 50
): Promise<ActivityEvent[]> {
  const data = await querySubgraph<Record<string, RawEvent[]>>(GATEWAY_EVENTS, {
    id: id.toLowerCase(),
    first,
  });
  return Object.values(data)
    .flat()
    .map(toEvent)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, first);
}

/* ── The feed and address history, a page at a time ─────────────────────── */

/** Event collections behind each Activity filter. */
export const FEED_COLLECTIONS = {
  fees: ["winningTicketRedeemedEvents", "withdrawFeesEvents"],
  staking: [
    "bondEvents",
    "unbondEvents",
    "rebondEvents",
    "transferBondEvents",
    "withdrawStakeEvents",
  ],
  rewards: ["rewardEvents", "newRoundEvents"],
  governance: ["voteEvents", "treasuryVoteEvents", "pollCreatedEvents"],
  orchestrators: [
    "transcoderUpdateEvents",
    "transcoderActivatedEvents",
    "transcoderDeactivatedEvents",
  ],
  gateways: ["depositFundedEvents", "reserveFundedEvents", "withdrawalEvents"],
} as const;

export type FeedFilter = "all" | keyof typeof FEED_COLLECTIONS;

const ALL_COLLECTIONS = Object.values(FEED_COLLECTIONS).flat();

/**
 * Where an address can appear in each collection: as delegator,
 * orchestrator, gateway or voter. Poll votes store the voter as plain text,
 * so they match either spelling. Collections not listed (new rounds, new
 * polls) involve no address.
 */
const ADDRESS_ROLES: Record<string, string[]> = {
  bondEvents: ["delegator", "newDelegate", "oldDelegate"],
  unbondEvents: ["delegator", "delegate"],
  rebondEvents: ["delegator", "delegate"],
  withdrawStakeEvents: ["delegator"],
  withdrawFeesEvents: ["delegator"],
  transferBondEvents: ["oldDelegator", "newDelegator"],
  rewardEvents: ["delegate"],
  transcoderUpdateEvents: ["delegate"],
  transcoderActivatedEvents: ["delegate"],
  transcoderDeactivatedEvents: ["delegate"],
  winningTicketRedeemedEvents: ["recipient", "sender"],
  depositFundedEvents: ["sender"],
  reserveFundedEvents: ["reserveHolder"],
  withdrawalEvents: ["sender"],
  treasuryVoteEvents: ["voter"],
  voteEvents: ["voter_in"],
};

export type EventPage = {
  events: ActivityEvent[];
  /** Where the next page starts; null when there's no more. */
  next: Cursor | null;
};

const PAGE = 50;

const collectionsFor = (filter: FeedFilter): readonly string[] =>
  filter === "all" ? ALL_COLLECTIONS : FEED_COLLECTIONS[filter];

/** One collection's slice of a page, with the cursor's bounds inlined. */
function collectionQuery(collection: string, cursor: Cursor, address?: string) {
  const bound = `timestamp_lte: ${cursor.before}`;
  let where = `{ ${bound} }`;
  if (address) {
    const roles = ADDRESS_ROLES[collection];
    where =
      roles.length === 1
        ? `{ ${roles[0]}: ${
            roles[0] === "voter_in" ? "$spellings" : "$id"
          }, ${bound} }`
        : `{ or: [${roles.map((r) => `{ ${r}: $id, ${bound} }`).join(", ")}] }`;
  }
  return `${collection}(first: ${PAGE}, skip: ${
    cursor.skip[collection] ?? 0
  }, orderBy: timestamp, orderDirection: desc, where: ${where}) { ${EVENT_FIELDS} }`;
}

/**
 * One page of events from several collections, merged newest first. With
 * an address, only events it's part of; with a filter, only that filter's
 * collections, so a filtered view pages back through all history.
 */
async function fetchCollectionsPage(
  collections: readonly string[],
  cursor: Cursor,
  address?: string
): Promise<EventPage> {
  const todo = collections.filter(
    (c) => !cursor.done.includes(c) && (!address || ADDRESS_ROLES[c])
  );
  if (!todo.length) return { events: [], next: null };
  const id = address?.toLowerCase();
  const query = /* GraphQL */ `
    query ${address ? "AddressEvents" : "FeedCollections"}${
    address ? "($id: String!, $spellings: [String!]!)" : ""
  } {
      ${todo.map((c) => collectionQuery(c, cursor, id)).join("\n")}
    }
  `;
  const data = await querySubgraph<Record<string, RawEvent[]>>(
    query,
    id ? { id, spellings: [id, getAddress(id)] } : {}
  );
  const { shown, next } = advance(data, cursor, PAGE);
  return { events: shown.map(toEvent), next };
}

/** Everything involving an address, for a filter, a page at a time. */
export function fetchAddressEvents(
  address: string,
  filter: FeedFilter,
  cursor: Cursor = FIRST_CURSOR
): Promise<EventPage> {
  return fetchCollectionsPage(collectionsFor(filter), cursor, address);
}

type RawTransaction = {
  id: string;
  timestamp: number;
  events: RawEvent[] | null;
};

const txEvents = (txs: RawTransaction[]) =>
  txs.flatMap((t) =>
    (t.events ?? []).filter((e) => EVENT_TYPES.includes(e.__typename))
  );

/**
 * One page of the protocol feed. "All" pages through transactions (each
 * one's events together); a filter reads its own collections.
 */
export async function fetchFeedPage(
  filter: FeedFilter,
  cursor: Cursor = FIRST_CURSOR
): Promise<EventPage> {
  if (filter !== "all")
    return fetchCollectionsPage(FEED_COLLECTIONS[filter], cursor);
  const { transactions } = await querySubgraph<{
    transactions: RawTransaction[];
  }>(
    /* GraphQL */ `
      query FeedTransactions($first: Int!, $skip: Int!, $before: Int!) {
        transactions(first: $first, skip: $skip, orderBy: timestamp, orderDirection: desc, where: { timestamp_lte: $before }) {
          id
          timestamp
          events { ${EVENT_FIELDS} }
        }
      }
    `,
    {
      first: PAGE,
      skip: cursor.skip.transactions ?? 0,
      before: cursor.before,
    }
  );
  const { shown, next } = advance({ transactions }, cursor, PAGE);
  return { events: txEvents(shown).map(toEvent), next };
}

/** Events newer than `after`, for keeping the top of the feed live. */
export async function fetchFeedSince(
  filter: FeedFilter,
  after: number
): Promise<ActivityEvent[]> {
  const since = `where: { timestamp_gt: ${Math.floor(after)} }`;
  if (filter === "all") {
    const { transactions } = await querySubgraph<{
      transactions: RawTransaction[];
    }>(/* GraphQL */ `
        query FeedTransactionsSince {
          transactions(first: 100, orderBy: timestamp, orderDirection: desc, ${since}) {
            id
            timestamp
            events { ${EVENT_FIELDS} }
          }
        }
      `);
    return txEvents(transactions)
      .map(toEvent)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  const data = await querySubgraph<Record<string, RawEvent[]>>(/* GraphQL */ `
    query FeedCollectionsSince {
      ${FEED_COLLECTIONS[filter]
        .map(
          (c) =>
            `${c}(first: 100, orderBy: timestamp, orderDirection: desc, ${since}) { ${EVENT_FIELDS} }`
        )
        .join("\n")}
    }
  `);
  return Object.values(data)
    .flat()
    .map(toEvent)
    .sort((a, b) => b.timestamp - a.timestamp);
}

const TRANSACTION_EVENTS = /* GraphQL */ `
  query TransactionEvents($id: ID!) {
    transaction(id: $id) {
      events {
        ${EVENT_FIELDS}
      }
    }
  }
`;

/** A transaction's protocol events, or null if the subgraph hasn't seen it. */
export async function fetchTransactionEvents(
  hash: string
): Promise<ActivityEvent[] | null> {
  const { transaction } = await querySubgraph<{
    transaction: { events: RawEvent[] | null } | null;
  }>(TRANSACTION_EVENTS, { id: hash.toLowerCase() });
  if (!transaction) return null;
  return (transaction.events ?? [])
    .filter((e) => EVENT_TYPES.includes(e.__typename))
    .map(toEvent);
}

const ORCHESTRATOR_UPDATES = /* GraphQL */ `
  query OrchestratorUpdates($ids: [String!]!, $since: Int!) {
    transcoderUpdateEvents(
      first: 100
      orderBy: timestamp
      orderDirection: desc
      where: { delegate_in: $ids, timestamp_gte: $since }
    ) {
      ${EVENT_FIELDS}
    }
  }
`;

/** Fee/reward cut changes for orchestrators — the portfolio's early warnings. */
export async function fetchOrchestratorUpdates(ids: string[], sinceTs: number) {
  if (!ids.length) return [];
  const { transcoderUpdateEvents } = await querySubgraph<{
    transcoderUpdateEvents: RawEvent[];
  }>(ORCHESTRATOR_UPDATES, {
    ids: ids.map((i) => i.toLowerCase()),
    since: sinceTs,
  });
  return transcoderUpdateEvents.map(toEvent);
}

/* ── Reward calls this round ─────────────────────────────────────────────── */

const REWARD_PROGRESS = /* GraphQL */ `
  query RewardProgress($round: String!) {
    pools(first: 1000, where: { round: $round }) {
      delegate {
        id
      }
      rewardTokens
      fees
    }
  }
`;

export type RewardProgress = {
  round: number;
  /** Orchestrators with a pool this round, i.e. the active set. */
  total: number;
  called: number;
  minted: number;
  /** ETH in fees earned by the active set so far this round. */
  fees: number;
};

export async function fetchRewardProgress(
  round: number
): Promise<RewardProgress> {
  const { pools } = await querySubgraph<{
    pools: {
      delegate: { id: string };
      rewardTokens: string | null;
      fees: string | null;
    }[];
  }>(REWARD_PROGRESS, { round: String(round) });
  const called = pools.filter((p) => p.rewardTokens != null);
  return {
    round,
    total: pools.length,
    called: called.length,
    minted: called.reduce((s, p) => s + Number(p.rewardTokens), 0),
    fees: pools.reduce((s, p) => s + Number(p.fees ?? 0), 0),
  };
}

/* ── Governance ──────────────────────────────────────────────────────────── */

export type TreasuryProposal = {
  id: string;
  title: string;
  description: string;
  proposer: string;
  voteStart: number;
  voteEnd: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  totalVotes: number;
};

export type Poll = {
  id: string;
  proposal: string;
  endBlock: number;
  quorum: number;
  quota: number;
  yes: number;
  no: number;
  voteCount: number;
};

const GOVERNANCE = /* GraphQL */ `
  query Governance {
    treasuryProposals(first: 100, orderBy: voteStart, orderDirection: desc) {
      id
      description
      voteStart
      voteEnd
      forVotes
      againstVotes
      abstainVotes
      totalVotes
      proposer {
        id
      }
    }
    polls(first: 100, orderBy: endBlock, orderDirection: desc) {
      id
      proposal
      endBlock
      quorum
      quota
      tally {
        yes
        no
      }
      votes(first: 1000) {
        id
      }
    }
  }
`;

/**
 * Title of a proposal description: the front-matter `title` when present,
 * otherwise the first non-empty line with any heading marks removed.
 */
export function proposalTitle(description: string) {
  let body = description;
  const fm = /^---\s*\n([\s\S]*?)\n---\s*(\n|$)/.exec(description);
  if (fm) {
    const title = /^title:\s*["']?(.+?)["']?\s*$/m.exec(fm[1])?.[1];
    if (title) return title;
    body = description.slice(fm[0].length);
  }
  const line = body
    .split("\n")
    .map((l) => l.trim())
    .find(Boolean);
  return (line ?? "Untitled proposal").replace(/^#+\s*/, "");
}

export async function fetchGovernance() {
  const { treasuryProposals, polls } = await querySubgraph<{
    treasuryProposals: RawProposal[];
    polls: RawPoll[];
  }>(GOVERNANCE);
  return {
    proposals: treasuryProposals.map(
      (p): TreasuryProposal => ({
        id: p.id,
        title: proposalTitle(p.description),
        description: p.description,
        proposer: p.proposer.id,
        voteStart: Number(p.voteStart),
        voteEnd: Number(p.voteEnd),
        forVotes: Number(p.forVotes),
        againstVotes: Number(p.againstVotes),
        abstainVotes: Number(p.abstainVotes),
        totalVotes: Number(p.totalVotes),
      })
    ),
    polls: polls.map(
      (p): Poll => ({
        id: p.id,
        proposal: p.proposal,
        endBlock: Number(p.endBlock),
        quorum: Number(p.quorum) / 1e4,
        quota: Number(p.quota) / 1e4,
        yes: Number(p.tally?.yes ?? 0),
        no: Number(p.tally?.no ?? 0),
        voteCount: p.votes?.length ?? 0,
      })
    ),
  };
}

/* ── When each orchestrator called reward ────────────────────────────────── */

const REWARD_TIMES = /* GraphQL */ `
  query RewardTimes($delegates: [String!]!, $first: Int!, $lastId: String!) {
    rewardEvents(
      where: { delegate_in: $delegates, id_gt: $lastId }
      first: $first
      orderBy: id
    ) {
      id
      timestamp
      round {
        id
      }
      delegate {
        id
      }
    }
  }
`;

/** Reward-call time (unix s) by `${orchestrator}:${round}`. */
export async function fetchRewardTimes(
  delegates: string[]
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!delegates.length) return out;
  const rows = await paginate<{
    id: string;
    timestamp: number;
    round: { id: string };
    delegate: { id: string };
  }>(
    REWARD_TIMES,
    "rewardEvents",
    { delegates: delegates.map((d) => d.toLowerCase()) },
    { max: 100_000 }
  );
  for (const r of rows)
    out.set(
      `${r.delegate.id.toLowerCase()}:${r.round.id}`,
      Number(r.timestamp)
    );
  return out;
}
