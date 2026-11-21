import { PoolHistory, PRECISE, type Snapshot } from "./compute";

/**
 * History before an LIP-73 claim.
 *
 * When an orchestrator migrated to Arbitrum, its delegators' stake went
 * into a delegator pool there, bonded to it, and earned from then on. A
 * delegator who claims later (L2Migrator.claimStake) receives their share
 * of the pool, rewards included; their own Arbitrum history only starts
 * at the claim. Without this, everything earned before it would read as
 * part of one big deposit on the claim day.
 *
 * The pool keeps each share's value growing exactly with its
 * orchestrator's cumulative reward factor (claims take stake out in
 * proportion), so a delegator with snapshot stake S held, from the
 * migration until the claim,
 *
 *   shares = S · 10^27 / CRF[migration round]
 *
 * of that orchestrator's pool: what a snapshot at the migration with those
 * shares describes, so the usual reconstruction yields the rewards and
 * fees. Checked against real claims, the rebuilt stake matches what was
 * received to within about one round's reward (the claim can land before
 * that round's reward call).
 */

export type StakeClaim = {
  account: string;
  /** The orchestrator on Ethereum, which keys the pool. */
  l1Delegate: string;
  /** Snapshot stake, wei. */
  stake: bigint;
  round: number;
};

export type OrchestratorMigration = {
  l1Addr: string;
  l2Addr: string;
  round: number;
  timestamp: number;
};

/**
 * The claims that came from a pool, each with its orchestrator's migration.
 * Left out when the account already had Arbitrum stake before claiming:
 * one account, one delegation, so the pool share can't be shown alongside.
 */
export function preClaimHistories(
  claims: StakeClaim[],
  migrations: Map<string, OrchestratorMigration>,
  snapshots: Snapshot[]
): { claim: StakeClaim; migration: OrchestratorMigration }[] {
  const out: { claim: StakeClaim; migration: OrchestratorMigration }[] = [];
  for (const claim of claims) {
    const account = claim.account.toLowerCase();
    // No pool: the orchestrator never migrated, so the stake sat on
    // Ethereum earning nothing until the claim.
    const migration = migrations.get(claim.l1Delegate.toLowerCase());
    if (!migration || migration.round >= claim.round || claim.stake <= 0n) {
      continue;
    }
    const earlier = snapshots.some(
      (s) => s.account.toLowerCase() === account && s.round < claim.round
    );
    if (!earlier) out.push({ claim, migration });
  }
  return out;
}

/**
 * A snapshot at the migration for each of those histories, standing for
 * the account's share of the pool until its real claim snapshot.
 */
export function preClaimSnapshots(
  histories: { claim: StakeClaim; migration: OrchestratorMigration }[],
  pools: Map<string, PoolHistory>
): Snapshot[] {
  return histories.map(({ claim, migration }) => {
    const delegate = migration.l2Addr.toLowerCase();
    const base = pools.get(delegate)?.at(migration.round)?.crf ?? PRECISE;
    return {
      account: claim.account.toLowerCase(),
      delegate,
      round: migration.round,
      shares: (claim.stake * PRECISE) / base,
      timestamp: migration.timestamp,
    };
  });
}
