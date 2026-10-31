import { createPublicClient, fallback, formatUnits, http } from "viem";

import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { L2_CHAIN, PROTOCOL_CONTRACTS, RPC_URLS } from "@/lib/config";

/**
 * Treasury proposal totals as the governor counts them. The subgraph adds
 * up each VoteCast's weight, but an orchestrator's weight already includes
 * its delegators' stake, and when a delegator votes the governor takes that
 * stake back off its orchestrator (GovernorCountingOverridable). The
 * subgraph doesn't, so a delegator voting alongside their orchestrator is
 * counted twice. proposalVotes() has the corrected figures.
 */
export type VoteTotals = {
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
};

const client = createPublicClient({
  chain: L2_CHAIN,
  transport: fallback(
    RPC_URLS[L2_CHAIN.id].map((url) =>
      http(url, { timeout: 10_000, batch: true })
    )
  ),
});

const lpt = (wei: bigint) => Number(formatUnits(wei, 18));

/** Each proposal's totals by id; one batched read for all of them. */
export async function readVoteTotals(
  ids: string[]
): Promise<Map<string, VoteTotals>> {
  const out = new Map<string, VoteTotals>();
  if (!ids.length) return out;
  const results = await client.multicall({
    allowFailure: true,
    contracts: ids.map((id) => ({
      address: PROTOCOL_CONTRACTS.LivepeerGovernor,
      abi: livepeerGovernor,
      functionName: "proposalVotes" as const,
      args: [BigInt(id)] as const,
    })),
  });
  results.forEach((r, i) => {
    if (r.status !== "success") return;
    const [against, inFavor, abstain] = r.result as readonly [
      bigint,
      bigint,
      bigint
    ];
    out.set(ids[i], {
      forVotes: lpt(inFavor),
      againstVotes: lpt(against),
      abstainVotes: lpt(abstain),
    });
  });
  return out;
}

/**
 * The governor's totals in place of the subgraph's, where read. A proposal
 * whose read failed keeps the subgraph's figures rather than showing none.
 */
export function withVoteTotals<T extends VoteTotals & { id: string }>(
  proposals: T[],
  totals: Map<string, VoteTotals>
): T[] {
  return proposals.map((p) => {
    const t = totals.get(p.id);
    return t ? { ...p, ...t } : p;
  });
}
