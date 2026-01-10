import { getCacheControlHeader } from "@lib/api";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
} from "@lib/api/errors";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import type { NextApiRequest, NextApiResponse } from "next";

const totalTokenSupply = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const method = _req.method;

    if (method === "GET") {
      const response = await fetchWithRetry(
        CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
        {
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
        },
        {
          retryOnMethods: ["POST"],
        }
      );

      if (!response.ok) {
        return externalApiError(res, "subgraph");
      }

      res.setHeader("Cache-Control", getCacheControlHeader("day"));

      const {
        data: { protocol },
      } = await response.json();
      return res.status(200).json(Number(protocol.totalSupply));
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default totalTokenSupply;
