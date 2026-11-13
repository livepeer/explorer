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
 * A snapshot at the migration for each claim that came from a pool,
 * standing for the account's share of it until its real claim snapshot.
 * Left out when the account already had Arbitrum stake before claiming:
 * one account, one delegation, so the pool share can't be shown alongside.
 */
export function preClaimSnapshots(
  claims: StakeClaim[],
  migrations: Map<string, OrchestratorMigration>,
  snapshots: Snapshot[],
  pools: Map<string, PoolHistory>
): Snapshot[] {
  const out: Snapshot[] = [];
  for (const c of claims) {
    const account = c.account.toLowerCase();
    // No pool: the orchestrator never migrated, so the stake sat on
    // Ethereum earning nothing until the claim.
    const m = migrations.get(c.l1Delegate.toLowerCase());
    if (!m || m.round >= c.round || c.stake <= 0n) continue;
    const earlier = snapshots.some(
      (s) => s.account.toLowerCase() === account && s.round < c.round
    );
    if (earlier) continue;
    const delegate = m.l2Addr.toLowerCase();
    const base = pools.get(delegate)?.at(m.round)?.crf ?? PRECISE;
    out.push({
      account,
      delegate,
      round: m.round,
      shares: (c.stake * PRECISE) / base,
      timestamp: m.timestamp,
    });
  }
  return out;
}
