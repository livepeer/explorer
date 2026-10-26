import { isAddress } from "viem";

import snapshot from "@/data/delegator-claim-snapshot.json";
import {
  leafOf,
  parseLeaf,
  type SnapshotEntry,
  SnapshotTree,
} from "@/lib/migration/tree";

/**
 * A delegator's entry in the LIP-73 migration snapshot and its Merkle
 * proof, for claiming their pre-Arbitrum stake and fees with
 * L2Migrator.claimStake. Kept on the server so the 1MB snapshot isn't
 * shipped to browsers. The snapshot never changes, so neither does this.
 *
 * GET ?address=0x… → { entry: { delegate, stake, fees } | null, proof }
 * (stake and fees in wei, as strings)
 */

let index: { tree: SnapshotTree; byAccount: Map<string, SnapshotEntry> };
function load() {
  if (!index) {
    const byAccount = new Map<string, SnapshotEntry>();
    for (const leaf of snapshot as string[]) {
      const e = parseLeaf(leaf);
      if (e && !byAccount.has(e.account)) byAccount.set(e.account, e);
    }
    index = { tree: new SnapshotTree(snapshot as string[]), byAccount };
  }
  return index;
}

export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address")?.toLowerCase();
  if (!address || !isAddress(address)) {
    return Response.json({ error: "Pass an address." }, { status: 400 });
  }
  const { tree, byAccount } = load();
  const entry = byAccount.get(address) ?? null;
  const body = entry
    ? {
        entry: {
          delegate: entry.delegate,
          stake: entry.stake.toString(),
          fees: entry.fees.toString(),
        },
        proof: tree.proof(leafOf(entry)),
      }
    : { entry: null, proof: null };
  return Response.json(body, {
    headers: { "Cache-Control": "public, s-maxage=86400, max-age=3600" },
  });
}
