import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity[] | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("week"));

      const response = await fetch(
        `https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-one`,
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
        }
      );

      const {
        data: { livepeerAccounts },
      } = await response.json();

      const addresses: string[] = livepeerAccounts
        ?.map((a) => a?.id)
        .filter((e) => e);

      const ensAddresses = await Promise.all(
        addresses.map((address) => getEnsForAddress(address))
      );

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
