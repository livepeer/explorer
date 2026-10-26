"use client";

import { useQuery } from "@tanstack/react-query";
import { type Hex, isAddress, zeroAddress } from "viem";
import { useConfig } from "wagmi";
import { readContract, readContracts } from "wagmi/actions";

import { bondingManager } from "@/lib/abis/BondingManager";
import { delegatorPool, l2Migrator } from "@/lib/abis/L2Migrator";
import { L2_CHAIN, L2_MIGRATOR, PROTOCOL_CONTRACTS } from "@/lib/config";
import { fromWei } from "@/lib/format";

/**
 * What a wallet can still claim from before Livepeer moved to Arbitrum
 * (LIP-73): its snapshot entry, and what claiming would pay today.
 *
 * - The snapshot says what it had delegated on Ethereum, and to whom.
 * - If that orchestrator migrated, its delegators' stake went into a pool
 *   that has stayed delegated (and earning) since; a claim pays the
 *   delegator's share of the pool now, so usually more than the snapshot.
 *   The stake stays with that orchestrator.
 * - If it didn't, the migrator pays the snapshot stake itself, and the
 *   delegator chooses an orchestrator for it.
 * - Snapshot fees are paid in ETH either way (plus the pool's fees, pooled).
 */
export type MigrationClaim = {
  /** Already claimed, or claiming is switched off. */
  status: "claimable" | "claimed" | "disabled";
  /** The orchestrator delegated to on Ethereum (zero: none). */
  delegate: string;
  /** The migrated orchestrator's pool, if it has one. */
  pool: string | null;
  /**
   * Where a pooled claim's stake lands: the orchestrator the pool delegates
   * to on Arbitrum, which may not be its old address on Ethereum.
   */
  poolDelegate: string | null;
  /** LPT the claim would delegate now, and ETH it would pay. */
  stake: number;
  fees: number;
  /** LPT at the snapshot, to show what the pool has added. */
  snapshotStake: number;
  /** The exact arguments claimStake takes. */
  args: { delegate: Hex; stake: bigint; fees: bigint; proof: Hex[] };
};

type Entry = { delegate: string; stake: string; fees: string };

async function fetchEntry(address: string) {
  const res = await fetch(`/api/migration/claim?address=${address}`);
  if (!res.ok) throw new Error("Couldn't check the migration snapshot");
  return (await res.json()) as { entry: Entry | null; proof: Hex[] | null };
}

/** null when the wallet isn't in the snapshot (most aren't). */
export function useMigrationClaim(address: string | null | undefined) {
  const config = useConfig();
  const account = address?.toLowerCase();
  return useQuery({
    queryKey: ["migration-claim", account],
    enabled: Boolean(account && isAddress(account)),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<MigrationClaim | null> => {
      const { entry, proof } = await fetchEntry(account!);
      if (!entry || !proof) return null;
      const delegate = entry.delegate as Hex;
      const stake = BigInt(entry.stake);
      const fees = BigInt(entry.fees);
      const [migrated, enabled, pool] = await readContracts(config, {
        allowFailure: false,
        contracts: [
          {
            address: L2_MIGRATOR,
            abi: l2Migrator,
            functionName: "migratedDelegators",
            args: [account as Hex],
            chainId: L2_CHAIN.id,
          },
          {
            address: L2_MIGRATOR,
            abi: l2Migrator,
            functionName: "claimStakeEnabled",
            chainId: L2_CHAIN.id,
          },
          {
            address: L2_MIGRATOR,
            abi: l2Migrator,
            functionName: "delegatorPools",
            args: [delegate],
            chainId: L2_CHAIN.id,
          },
        ],
      });
      const hasPool = delegate !== zeroAddress && pool !== zeroAddress;
      let owedStake = delegate === zeroAddress ? 0n : stake;
      let poolFees = 0n;
      let poolDelegate: string | null = null;
      if (hasPool && stake > 0n) {
        // As DelegatorPool.claim computes it: the pool's current stake and
        // fees, shared by what's still unclaimed of its initial stake.
        const [initial, claimed] = await readContracts(config, {
          allowFailure: false,
          contracts: [
            {
              address: pool,
              abi: delegatorPool,
              functionName: "initialStake",
              chainId: L2_CHAIN.id,
            },
            {
              address: pool,
              abi: delegatorPool,
              functionName: "claimedInitialStake",
              chainId: L2_CHAIN.id,
            },
          ],
        });
        const remaining = initial - claimed;
        if (remaining > 0n) {
          const read = (functionName: "pendingStake" | "pendingFees") =>
            readContract(config, {
              address: PROTOCOL_CONTRACTS.BondingManager,
              abi: bondingManager,
              functionName,
              args: [pool, 0n],
              chainId: L2_CHAIN.id,
            }) as Promise<bigint>;
          const [ps, pf] = await Promise.all([
            read("pendingStake"),
            read("pendingFees"),
          ]);
          owedStake = (ps * stake) / remaining;
          poolFees = (pf * stake) / remaining;
        }
        const info = (await readContract(config, {
          address: PROTOCOL_CONTRACTS.BondingManager,
          abi: bondingManager,
          functionName: "getDelegator",
          args: [pool],
          chainId: L2_CHAIN.id,
        })) as readonly unknown[];
        poolDelegate = (info[2] as string).toLowerCase();
      }
      return {
        status: migrated ? "claimed" : enabled ? "claimable" : "disabled",
        delegate,
        pool: hasPool ? pool : null,
        poolDelegate,
        stake: fromWei(owedStake),
        fees: fromWei(fees + poolFees),
        snapshotStake: fromWei(stake),
        args: { delegate, stake, fees, proof },
      };
    },
  });
}
