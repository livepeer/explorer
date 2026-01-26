import { getCacheControlHeader, getCurrentRound } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { getBondingManagerAddress } from "@lib/api/contracts";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import { AddressSchema, PendingFeesAndStakeSchema } from "@lib/api/schemas";
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

      const { address } = req.query;

      // Validate input: address query parameter
      if (!address || Array.isArray(address)) {
        return badRequest(
          res,
          "Address query parameter is required and must be a single value"
        );
      }

      const addressResult = AddressSchema.safeParse(address);
      if (!addressResult.success) {
        return badRequest(
          res,
          "Invalid address format",
          addressResult.error.issues.map((e) => e.message).join(", ")
        );
      }

      const validatedAddress = addressResult.data;

      const bondingManagerAddress = await getBondingManagerAddress();

      const {
        data: { protocol },
      } = await getCurrentRound();
      const currentRoundString = protocol?.currentRound?.id;

      if (!currentRoundString) {
        throw new Error("No current round found");
      }
      const currentRound = BigInt(currentRoundString);

      const [pendingStake, pendingFees] = await l2PublicClient.multicall({
        allowFailure: false,
        contracts: [
          {
            address: bondingManagerAddress,
            abi: bondingManager,
            functionName: "pendingStake",
            args: [validatedAddress as `0x${string}`, currentRound],
          },
          {
            address: bondingManagerAddress,
            abi: bondingManager,
            functionName: "pendingFees",
            args: [validatedAddress as `0x${string}`, currentRound],
          },
        ],
      });

      const roundInfo: PendingFeesAndStake = {
        pendingStake: pendingStake.toString(),
        pendingFees: pendingFees.toString(),
      };

      // Validate output: pending fees and stake response
      const outputResult = PendingFeesAndStakeSchema.safeParse(roundInfo);
      const validationError = validateOutput(
        outputResult,
        res,
        "api/pending-stake"
      );
      if (validationError) return validationError;

      return res.status(200).json(roundInfo);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
