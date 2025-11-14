import { getCacheControlHeader } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
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

      const {
        data: { livepeerAccounts },
      } = await response.json();

      const addresses: string[] = livepeerAccounts
        ?.map((a) => a?.id)
        .filter((e) => e);

      const ensAddresses: EnsIdentity[] = (
        await Promise.all(
          addresses.map(async (address) => {
            try {
              return await getEnsForAddress(address as Address);
            } catch {}

            return null;
          })
        )
      )
        .filter((e) => e)
        .map((e) => e!);

      return res.status(200).json(ensAddresses);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
