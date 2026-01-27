import { getCacheControlHeader, getCurrentRound } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { getBondingManagerAddress } from "@lib/api/contracts";
import {
  internalError,
  methodNotAllowed,
  validateInput,
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

      // AddressSchema handles undefined, arrays, and validates format
      const addressResult = AddressSchema.safeParse(address);
      const inputValidationError = validateInput(
        addressResult,
        res,
        "Invalid address format"
      );
      if (inputValidationError) return inputValidationError;

      if (!addressResult.success) {
        return internalError(res, new Error("Address validation failed"));
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
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/pending-stake"
      );
      if (outputValidationError) return outputValidationError;

      return res.status(200).json(roundInfo);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
