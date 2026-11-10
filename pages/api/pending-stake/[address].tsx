import { getCacheControlHeader } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { roundsManager } from "@lib/api/abis/main/RoundsManager";
import {
  getBondingManagerAddress,
  getRoundsManagerAddress,
} from "@lib/api/contracts";
import {
  internalError,
  methodNotAllowed,
  validateInput,
} from "@lib/api/errors";
import { AddressSchema } from "@lib/api/schemas";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PendingFeesAndStake | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      const addressResult = AddressSchema.safeParse(req.query.address);
      if (!addressResult.success) {
        return validateInput(addressResult, res, "Invalid address format");
      }
      const address = addressResult.data;

      const [bondingManagerAddress, roundsManagerAddress] = await Promise.all([
        getBondingManagerAddress(),
        getRoundsManagerAddress(),
      ]);

      const currentRound = await l2PublicClient.readContract({
        address: roundsManagerAddress,
        abi: roundsManager,
        functionName: "currentRound",
      });

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
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
