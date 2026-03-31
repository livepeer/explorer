import { getCacheControlHeader } from "@lib/api";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import {
  SubgraphTotalSupplyResponseSchema,
  TotalTokenSupplyOutputSchema,
} from "@lib/api/schemas/total-token-supply";
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

      const jsonResponse = await response.json();

      const subgraphValidation =
        SubgraphTotalSupplyResponseSchema.safeParse(jsonResponse);

      if (!subgraphValidation.success) {
        return externalApiError(
          res,
          "subgraph",
          "Invalid response structure from subgraph"
        );
      }

      const {
        data: { protocol },
      } = subgraphValidation.data;

      const result = Number(protocol.totalSupply);

      if (
        validateOutput(
          TotalTokenSupplyOutputSchema.safeParse(result),
          res,
          "totalTokenSupply"
        )
      ) {
        return;
      }

      return res.status(200).json(result);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default totalTokenSupply;
