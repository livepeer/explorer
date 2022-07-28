import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { getBondingManager } from "@lib/api/contracts";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import { BigNumber } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PendingFeesAndStake | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("second"));

      const { address } = req.query;

      if (isValidAddress(address)) {
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
                  protocol(id: "0") {
                    id
                    currentRound {
                      id
                    }
                  }
                }
            `,
            }),
          }
        );

        const {
          data: { protocol },
        } = await response.json();

        const bondingManager = await getBondingManager();

        const pendingStake = await bondingManager.pendingStake(
          address,
          protocol?.currentRound?.id
        );

        const pendingFees = await bondingManager.pendingFees(
          address,
          protocol?.currentRound?.id
        );

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
