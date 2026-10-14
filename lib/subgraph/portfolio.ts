import { decimalToWei } from "@/lib/format";
import {
  type AccountState,
  computePortfolio,
  PoolHistory,
  type PoolPoint,
  type PortfolioResult,
  type RoundPoint,
  type Snapshot,
} from "@/lib/portfolio/compute";

import { isActiveInRound } from "./active";
import { paginate, querySubgraph } from "./client";

type RawUnbondingLock = {
  id: string;
  unbondingLockId: number;
  amount: string;
  withdrawRound: string;
  delegate: { id: string };
};

export type RawDelegator = {
  id: string;
  bondedAmount: string;
  principal: string;
  unbonded: string;
  fees: string;
  withdrawnFees: string;
  shares: string;
  startRound: string;
  lastClaimRound: { id: string } | null;
  delegate: {
    id: string;
    /** Derived from the rounds below; see `isActiveInRound`. */
    active: boolean;
    activationRound: string;
    deactivationRound: string;
    status: string;
    rewardCut: string;
    feeShare: string;
    totalStake: string;
    lastRewardRound: { id: string } | null;
    pendingRewardCommission: string;
    pendingFeeCommission: string;
  } | null;
  unbondingLocks: RawUnbondingLock[] | null;
};

const DELEGATORS = /* GraphQL */ `
  query Delegators($ids: [ID!]!) {
    protocol(id: "0") {
      currentRound {
        id
      }
    }
    delegators(where: { id_in: $ids }) {
      id
      bondedAmount
      principal
      unbonded
      fees
      withdrawnFees
      shares
      startRound
      lastClaimRound {
        id
      }
      delegate {
        id
        activationRound
        deactivationRound
        status
        rewardCut
        feeShare
        totalStake
        lastRewardRound {
          id
        }
        pendingRewardCommission
        pendingFeeCommission
      }
      unbondingLocks {
        id
        unbondingLockId
        amount
        withdrawRound
        delegate {
          id
        }
      }
    }
  }
`;

const SNAPSHOTS = /* GraphQL */ `
  query Snapshots($ids: [String!]!, $first: Int!, $lastId: String!) {
    delegatorSnapshots(
      where: { delegator_in: $ids, id_gt: $lastId }
      first: $first
      orderBy: id
    ) {
      id
      delegator {
        id
      }
      delegate {
        id
      }
      round {
        id
      }
      shares
      timestamp
    }
  }
`;

const POOLS = /* GraphQL */ `
  query Pools($delegate: String!, $first: Int!, $lastId: String!) {
    pools(
      where: { delegate: $delegate, id_gt: $lastId }
      first: $first
      orderBy: id
    ) {
      id
      round {
        id
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

const ROUNDS = /* GraphQL */ `
  query Rounds($since: Int!, $first: Int!, $lastId: String!) {
    rounds(
      where: { startTimestamp_gte: $since, id_gt: $lastId }
      first: $first
      orderBy: id
    ) {
      id
      startTimestamp
      totalActiveStake
    }
  }
`;

type RawSnapshot = {
  id: string;
  delegator: { id: string };
  delegate: { id: string } | null;
  round: { id: string };
  shares: string;
  timestamp: number;
};

type RawPool = {
  id: string;
  round: { id: string };
  cumulativeRewardFactor: string;
  cumulativeFeeFactor: string;
  rewardTokens: string | null;
  rewardCut: string;
  feeShare: string;
  totalStake: string;
  fees: string;
};

type RawRound = {
  id: string;
  startTimestamp: number;
  totalActiveStake: string;
};

export type UnbondingLock = {
  id: string;
  lockId: number;
  account: string;
  delegate: string;
  amount: number;
  withdrawRound: number;
};

export type PortfolioData = PortfolioResult & {
  currentRound: number;
  delegators: RawDelegator[];
  unbonding: UnbondingLock[];
  rounds: RoundPoint[];
};

export const toPoolPoint = (p: RawPool): PoolPoint => ({
  round: Number(p.round.id),
  crf: BigInt(p.cumulativeRewardFactor),
  cff: BigInt(p.cumulativeFeeFactor),
  rewardTokens: p.rewardTokens ? decimalToWei(p.rewardTokens) : null,
  rewardCut: BigInt(p.rewardCut),
  feeShare: BigInt(p.feeShare),
  totalStake: decimalToWei(p.totalStake),
  fees: decimalToWei(p.fees),
});

export async function fetchPortfolio(
  addresses: string[]
): Promise<PortfolioData> {
  const ids = [...new Set(addresses.map((a) => a.toLowerCase()))];

  const [{ protocol, delegators }, rawSnapshots] = await Promise.all([
    querySubgraph<{
      protocol: { currentRound: { id: string } };
      delegators: RawDelegator[];
    }>(DELEGATORS, { ids }),
    paginate<RawSnapshot>(SNAPSHOTS, "delegatorSnapshots", { ids }),
  ]);

  const currentRound = Number(protocol.currentRound.id);
  for (const d of delegators)
    if (d.delegate)
      d.delegate.active = isActiveInRound(
        d.delegate.activationRound,
        d.delegate.deactivationRound,
        currentRound
      );

  const snapshots: Snapshot[] = rawSnapshots.map((s) => ({
    account: s.delegator.id,
    delegate: s.delegate?.id ?? null,
    round: Number(s.round.id),
    shares: BigInt(s.shares),
  }));

  // Every orchestrator any account has ever been bonded to.
  const delegates = new Set<string>();
  for (const s of snapshots) if (s.delegate) delegates.add(s.delegate);
  for (const d of delegators) if (d.delegate) delegates.add(d.delegate.id);

  const earliest = rawSnapshots.reduce(
    (min, s) => Math.min(min, s.timestamp),
    Number.POSITIVE_INFINITY
  );
  // One round of slack before the first snapshot for the reward delta.
  const since = Number.isFinite(earliest) ? earliest - 3 * 86400 : 0;

  const [poolEntries, rawRounds] = await Promise.all([
    Promise.all(
      [...delegates].map(async (delegate) => {
        const pools = await paginate<RawPool>(POOLS, "pools", { delegate });
        return [delegate, new PoolHistory(pools.map(toPoolPoint))] as const;
      })
    ),
    since > 0
      ? paginate<RawRound>(ROUNDS, "rounds", { since })
      : Promise.resolve([]),
  ]);

  const rounds: RoundPoint[] = rawRounds
    .map((r) => ({
      round: Number(r.id),
      ts: r.startTimestamp,
      totalActiveStake: Number(r.totalActiveStake),
    }))
    .filter((r) => r.round <= currentRound)
    .sort((a, b) => a.round - b.round);

  const accounts: AccountState[] = delegators.map((d) => ({
    id: d.id,
    delegate: d.delegate?.id ?? null,
    shares: BigInt(d.shares || "0"),
    fees: decimalToWei(d.fees),
    lastClaimRound: Number(d.lastClaimRound?.id ?? d.startRound),
    pendingRewardCommission:
      d.delegate?.id === d.id ? BigInt(d.delegate.pendingRewardCommission) : 0n,
    pendingFeeCommission:
      d.delegate?.id === d.id ? BigInt(d.delegate.pendingFeeCommission) : 0n,
  }));

  const result = computePortfolio({
    accounts,
    snapshots,
    pools: new Map(poolEntries),
    rounds,
  });

  const unbonding: UnbondingLock[] = delegators.flatMap((d) =>
    (d.unbondingLocks ?? [])
      .map((l) => ({
        id: l.id,
        lockId: l.unbondingLockId,
        account: d.id,
        delegate: l.delegate.id,
        amount: Number(l.amount),
        withdrawRound: Number(l.withdrawRound),
      }))
      .filter((l) => l.amount > 0)
  );

  return { ...result, currentRound, delegators, unbonding, rounds };
}
