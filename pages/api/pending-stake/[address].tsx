import { getCacheControlHeader, getCurrentRound } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { getBondingManagerAddress } from "@lib/api/contracts";
import { badRequest, internalError, methodNotAllowed } from "@lib/api/errors";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import { l2PublicClient } from "@lib/chains";
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

        const {
          data: { protocol },
        } = await getCurrentRound();
        const currentRoundString = protocol?.currentRound?.id;

        if (!currentRoundString) {
          return badRequest(res, "No current round found");
        }
        const currentRound = BigInt(currentRoundString);

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
        return badRequest(res, "Invalid address format");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
