import { createPublicClient, fallback, http } from "viem";

import { L2_CHAIN, RPC_URLS } from "@/lib/config";
import { fetchIndexedBlock } from "@/lib/subgraph/sync";

/** Blocks behind before data counts as stale: ~3,600 at ~4/s is ~15 min. */
const MAX_LAG = 3_600;
/** Arbitrum One's average block time, to put the lag in minutes. */
const SECONDS_PER_BLOCK = 0.25;

const l2 = createPublicClient({
  chain: L2_CHAIN,
  transport: fallback(RPC_URLS[L2_CHAIN.id].map((u) => http(u))),
});

/**
 * How far the subgraph is behind Arbitrum's chain head. A halted subgraph
 * keeps answering queries with old data, so a successful request alone
 * doesn't mean the explorer is current. Fails open: if either side can't be
 * read, it reports healthy rather than warn on a probe hiccup. Cached for a
 * minute so every visitor shares one check.
 *
 * GET → { degraded: boolean, lagMinutes: number | null }
 */
export async function GET() {
  const [indexed, head] = await Promise.allSettled([
    fetchIndexedBlock(AbortSignal.timeout(8_000)),
    l2.getBlockNumber(),
  ]);
  const served = indexed.status === "fulfilled" ? indexed.value : null;
  const chain = head.status === "fulfilled" ? Number(head.value) : null;
  const lag = served != null && chain != null ? chain - served : null;
  return Response.json(
    {
      degraded: lag != null && lag > MAX_LAG,
      lagMinutes:
        lag != null ? Math.round((lag * SECONDS_PER_BLOCK) / 60) : null,
    },
    {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=60",
      },
    }
  );
}
