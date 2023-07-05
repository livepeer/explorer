import { getCacheControlHeader } from "@lib/api";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import type { NextApiRequest, NextApiResponse } from "next";

const totalTokenSupply = async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
          query {
            protocol(id: "0") {
              totalSupply
            }
          }
      `,
    }),
  });

  res.setHeader("Cache-Control", getCacheControlHeader("day"));

  const {
    data: { protocol },
  } = await response.json();
  res.json(Number(protocol.totalSupply));
};

export default totalTokenSupply;
