import { getCacheControlHeader } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { getBondingManagerAddress } from "@lib/api/contracts";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import { l2PublicClient } from "@lib/chains";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";
import { isAddress } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PendingFeesAndStake | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      const { address } = req.query;

      if (!!address && !Array.isArray(address) && isAddress(address)) {
        const bondingManagerAddress = await getBondingManagerAddress();

        const response = await fetchWithRetry(
          CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: `
                {
                  protocol(id: "0") {
                    currentRound {
                      id
                    }
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
          data: {
            protocol: {
              currentRound: { id: currentRound },
            },
          },
        } = await response.json();

        const [pendingStake, pendingFees] = await l2PublicClient.multicall({
          allowFailure: false,
          contracts: [
            {
              address: bondingManagerAddress,
              abi: bondingManager,
              functionName: "pendingStake",
              args: [address as `0x${string}`, currentRound],
            },
            {
              address: bondingManagerAddress,
              abi: bondingManager,
              functionName: "pendingFees",
              args: [address as `0x${string}`, currentRound],
            },
          ],
        });

        const roundInfo: PendingFeesAndStake = {
          pendingStake: pendingStake.toString(),
          pendingFees: pendingFees.toString(),
        };

        return res.status(200).json(roundInfo);
      } else {
        return res.status(500).end("Invalid ID");
      }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
