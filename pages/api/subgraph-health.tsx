import { l2PublicClient } from "@lib/chains";
import type { NextApiRequest, NextApiResponse } from "next";

import { getApollo, MetaDocument, MetaQuery } from "../../apollo";

// Block lag before data is stale. ~3,600 Arbitrum One blocks (~4/s) ≈ 15 min.
const MAX_BLOCK_DRIFT = 3_600;

/**
 * Reports whether the subgraph is far enough behind the L2 chain head that
 * Explorer data may be stale. Uses block drift, not hasIndexingErrors, which
 * stays false during a fatal halt. Fails open on a failed probe.
 */
const subgraphHealth = async (req: NextApiRequest, res: NextApiResponse) => {
  const method = req.method;
  if (method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  const [metaResult, chainHeadResult] = await Promise.allSettled([
    getApollo().query<MetaQuery>({
      query: MetaDocument,
      // Bypass the shared InMemoryCache, which would pin a stale block.
      fetchPolicy: "no-cache",
    }),
    l2PublicClient.getBlockNumber(),
  ]);

  const servedBlock =
    metaResult.status === "fulfilled"
      ? metaResult.value.data._meta?.block?.number
      : undefined;
  const chainHead =
    chainHeadResult.status === "fulfilled"
      ? Number(chainHeadResult.value)
      : undefined;

  const degraded =
    servedBlock != null && chainHead != null
      ? chainHead - servedBlock > MAX_BLOCK_DRIFT
      : false;

  // Cache briefly so one server-side check is shared across clients.
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=60");
  return res.status(200).json({ degraded });
};

export default subgraphHealth;
