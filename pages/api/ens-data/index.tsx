import { getCacheControlHeader } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import { AddressSchema, EnsIdentityArraySchema } from "@lib/api/schemas";
import { LivepeerAccountsSubgraphSchema } from "@lib/api/schemas/subgraph";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity[] | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("week"));

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
                livepeerAccounts(
                  first: 200
                  orderBy: lastUpdatedTimestamp
                  orderDirection: desc
                ) {
                  id
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
        const errorText = await response.text().catch(() => "");
        console.error(
          "Subgraph fetch error:",
          response.status,
          errorText,
          `URL: ${CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph}`
        );
        return externalApiError(
          res,
          "subgraph",
          `Status ${response.status}: ${errorText}`
        );
      }

      const responseData = await response.json();

      // Validate external API response: subgraph response structure
      const subgraphResult =
        LivepeerAccountsSubgraphSchema.safeParse(responseData);
      if (!subgraphResult.success) {
        console.error(
          "[api/ens-data] Subgraph response validation failed:",
          subgraphResult.error
        );
        return externalApiError(
          res,
          "subgraph",
          "Invalid response structure from subgraph"
        );
      }

      const { livepeerAccounts } = subgraphResult.data.data;

      // Validate and filter addresses
      const addresses: string[] = (livepeerAccounts || [])
        .map((a) => a.id)
        .filter((id) => {
          const addressResult = AddressSchema.safeParse(id);
          if (!addressResult.success) {
            console.warn(
              `[api/ens-data] Invalid address from subgraph: ${id}`,
              addressResult.error.issues.map((e) => e.message).join(", ")
            );
            return false;
          }
          return true;
        });

      const ensAddresses: EnsIdentity[] = (
        await Promise.all(
          addresses.map(async (address) => {
            try {
              return await getEnsForAddress(address as Address);
            } catch {
              return null;
            }
          })
        )
      )
        .filter((e) => e)
        .map((e) => e!);

      // Validate output: array of ENS identities
      const outputResult = EnsIdentityArraySchema.safeParse(ensAddresses);
      const validationError = validateOutput(
        outputResult,
        res,
        "api/ens-data/index"
      );
      if (validationError) return validationError;

      return res.status(200).json(ensAddresses);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
