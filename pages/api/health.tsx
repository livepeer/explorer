import type { NextApiRequest, NextApiResponse } from "next";

import { getApollo, MetaDocument, MetaQuery } from "../../apollo";

const health = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const method = req.method;
    if (method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).end(`Method ${method} Not Allowed`);
    }

    const client = getApollo();
    const apolloSubgraphFetch = client.query<MetaQuery>({
      query: MetaDocument,
    });
    const checks = await Promise.allSettled([apolloSubgraphFetch]);

    const subgraphOk =
      checks[0].status === "fulfilled" &&
      checks[0].value.data._meta &&
      checks[0].value.data._meta?.hasIndexingErrors === false;

    const allHealthy = subgraphOk;

    // DEBUG (remove before merge): report the runtime and whether the
    // sanitize-html require chain loads on it.
    let sanitizeHtmlLoads: string;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const s = require("sanitize-html");
      sanitizeHtmlLoads = `ok (sanitized: ${s("<b>x</b><script>y</script>")})`;
    } catch (e) {
      sanitizeHtmlLoads = `LOAD FAILED: ${(e as Error).message}`;
    }

    const response = {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      sanitizeHtml: sanitizeHtmlLoads,
      checks: {
        subgraph: subgraphOk ? "ok" : "error",
      },
    };

    return res.status(allHealthy ? 200 : 503).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
    });
  }
};

export default health;
