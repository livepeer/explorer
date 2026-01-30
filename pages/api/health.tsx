import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { createApolloFetch } from "apollo-fetch";
import type { NextApiRequest, NextApiResponse } from "next";

const health = async (_req: NextApiRequest, res: NextApiResponse) => {
  const apolloSubgraphFetch = createApolloFetch({
    uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
  });
  const checks = await Promise.allSettled([
    apolloSubgraphFetch({
      query: `{ _meta { hasIndexingErrors } }`,
    }),
  ]);

  const subgraphOk =
    checks[0].status === "fulfilled" &&
    checks[0].value.data._meta.hasIndexingErrors === false;

  const allHealthy = subgraphOk;

  const response = {
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks: {
      subgraph: subgraphOk ? "ok" : "error",
    },
  };

  return res.status(allHealthy ? 200 : 503).json(response);
};

export default health;
