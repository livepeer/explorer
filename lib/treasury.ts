import { createPublicClient, fallback, formatUnits, http } from "viem";

import { bondingManager } from "@/lib/abis/BondingManager";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { L2_CHAIN, PROTOCOL_CONTRACTS, RPC_URLS } from "@/lib/config";

import type { TreasuryState } from "./treasury-model";

export type { TreasuryState } from "./treasury-model";

/**
 * The protocol treasury: a share of each round's reward minting (the
 * treasury reward cut) is paid into it until its LPT balance reaches the
 * ceiling. Then BondingManager sets the cut to 0, and the treasury stops
 * filling until governance sets a cut again. Funded proposals spend from
 * it, so its balance falls as well as rises.
 */

/** The first block the treasury held LPT (12 Oct 2023). */
const FIRST_BLOCK = 140_046_894n;
/** Balance samples across its history. */
const SAMPLES = 80;
/** BondingManager's percentages are parts of 10^27. */
const PERC_DIVISOR = 10n ** 27n;

// Historical balances need an archive node: the configured RPCs, tried in
// order (the public endpoint last, as it only answers recent blocks).
const client = createPublicClient({
  chain: L2_CHAIN,
  transport: fallback(
    RPC_URLS[L2_CHAIN.id].map((url) =>
      http(url, { timeout: 15_000, batch: true })
    )
  ),
});

const lpt = (wei: bigint) => Number(formatUnits(wei, 18));
const percent = (v: bigint) =>
  Number((v * 1_000_000n) / PERC_DIVISOR) / 1_000_000;

async function balanceAt(blockNumber?: bigint) {
  return client.readContract({
    address: PROTOCOL_CONTRACTS.LivepeerToken,
    abi: livepeerToken,
    functionName: "balanceOf",
    args: [PROTOCOL_CONTRACTS.Treasury],
    blockNumber,
  }) as Promise<bigint>;
}

export async function fetchTreasury(): Promise<TreasuryState> {
  const head = await client.getBlock();
  const [balance, ceiling, cut, nextCut] = await Promise.all([
    balanceAt(head.number),
    client.readContract({
      address: PROTOCOL_CONTRACTS.BondingManager,
      abi: bondingManager,
      functionName: "treasuryBalanceCeiling",
      blockNumber: head.number,
    }) as Promise<bigint>,
    client.readContract({
      address: PROTOCOL_CONTRACTS.BondingManager,
      abi: bondingManager,
      functionName: "treasuryRewardCutRate",
      blockNumber: head.number,
    }) as Promise<bigint>,
    client.readContract({
      address: PROTOCOL_CONTRACTS.BondingManager,
      abi: bondingManager,
      functionName: "nextRoundTreasuryRewardCutRate",
      blockNumber: head.number,
    }) as Promise<bigint>,
  ]);

  // Evenly spaced blocks, each dated by its own timestamp: Arbitrum's block
  // time drifts, so a block number alone isn't a date.
  const span = head.number - FIRST_BLOCK;
  const blocks = Array.from(
    { length: SAMPLES },
    (_, i) => FIRST_BLOCK + (span * BigInt(i)) / BigInt(SAMPLES)
  );
  const samples = await Promise.all(
    blocks.map(async (n) => {
      try {
        const [b, block] = await Promise.all([
          balanceAt(n),
          client.getBlock({ blockNumber: n }),
        ]);
        return { ts: Number(block.timestamp), value: lpt(b) };
      } catch {
        // A sample an RPC can't serve is left out, not guessed.
        return null;
      }
    })
  );
  const history = [
    ...samples.filter((s): s is { ts: number; value: number } => s != null),
    { ts: Number(head.timestamp), value: lpt(balance) },
  ];

  return {
    balance: lpt(balance),
    ceiling: lpt(ceiling),
    cut: percent(cut),
    nextCut: percent(nextCut),
    history,
  };
}
