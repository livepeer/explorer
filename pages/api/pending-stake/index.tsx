import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { roundsManager } from "@lib/api/abis/main/RoundsManager";
import {
  getLivepeerTokenAddress,
  getBondingManagerAddress,
  getRoundsManagerAddress,
} from "@lib/api/contracts";

import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import { CHAIN_INFO, DEFAULT_CHAIN_ID, l2PublicClient } from "@lib/chains";
import { BigNumber } from "ethers";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PendingFeesAndStake | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      // const { address } = req.query;

      // if (isValidAddress(address)) {
      const roundsManagerAddress = await getRoundsManagerAddress();
      const bondingManagerAddress = await getBondingManagerAddress();

      const currentRound = await l2PublicClient.readContract({
        address: roundsManagerAddress,
        abi: roundsManager,
        functionName: "currentRound",
      });

      let totalSum = BigNumber.from(0);
      let skip = 0;
      let allDelegatorsFetched = false;

      while (!allDelegatorsFetched) {
        const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
                  query {
                    delegators(first: 1000, skip: ${skip}) {
                      id
                    }
                  }
              `,
          }),
        });

        const { data } = await response.json();
        const delegators = data?.delegators || [];

        if (delegators.length === 0) {
          allDelegatorsFetched = true;
        } else {
          for (const delegator of delegators) {
            const pendingStake = await l2PublicClient.readContract({
              address: bondingManagerAddress,
              abi: bondingManager,
              functionName: "pendingStake",
              args: [delegator.id as Address, currentRound],
            });

            totalSum = totalSum.add(pendingStake);

            console.log({ totalSum: totalSum.toString() });
          }

          console.log({ totalSum: totalSum.toString() });
          console.log({ skip });

          skip += 1000;
        }
      }

      console.log({ totalSum: totalSum.toString() });

      // const pendingFees = await l2PublicClient.readContract({
      //   address: bondingManagerAddress,
      //   abi: bondingManager,
      //   functionName: "pendingFees",
      //   args: [address as Address, currentRound],
      // });

      // const roundInfo: PendingFeesAndStake = {
      //   pendingStake: pendingStake.toString(),
      //   pendingFees: pendingFees.toString(),
      // };

      return res.status(200).json({ totalSum });
      // } else {
      //   return res.status(500).end("Invalid ID");
      // }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
