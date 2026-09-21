import { getCacheControlHeader } from "@lib/api";
import {
  ENS_CACHE_TTL,
  getEnsForAddressCached,
  LockBusyError,
} from "@lib/api/ens";
import { internalError, methodNotAllowed } from "@lib/api/errors";
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

      const {
        data: { livepeerAccounts },
      } = await response.json();

      const addresses: string[] = livepeerAccounts
        ?.map((a) => a?.id)
        .filter((e) => e);

      let hadLockContention = false;

      const ensAddresses: EnsIdentity[] = (
        await Promise.all(
          addresses.map(async (address) => {
            try {
              return await getEnsForAddressCached(address as Address);
            } catch (err) {
              if (err instanceof LockBusyError) {
                hadLockContention = true;
              }
              return null;
            }
          })
        )
      )
        .filter((e) => e)
        .map((e) => e!);

      res.setHeader(
        "Cache-Control",
        hadLockContention ? "no-store" : getCacheControlHeader(ENS_CACHE_TTL)
      );

      return res.status(200).json(ensAddresses);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
