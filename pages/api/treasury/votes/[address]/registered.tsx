import { getCacheControlHeader } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { bondingVotes } from "@lib/api/abis/main/BondingVotes";
import {
  getBondingManagerAddress,
  getBondingVotesAddress,
} from "@lib/api/contracts";
import {
  internalError,
  methodNotAllowed,
  validateInput,
  validateOutput,
} from "@lib/api/errors";
import { AddressSchema, RegisteredToVoteSchema } from "@lib/api/schemas";
import { RegisteredToVote } from "@lib/api/types/get-treasury-proposal";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<RegisteredToVote | null>
) => {
  try {
    const { method } = req;
    if (method !== "GET") {
      return methodNotAllowed(res, method ?? "unknown", ["GET"]);
    }

    const address = req.query.address?.toString();
    const addressResult = AddressSchema.safeParse(address);
    const inputValidationError = validateInput(
      addressResult,
      res,
      "Invalid address format"
    );
    if (inputValidationError) return inputValidationError;

    if (!addressResult.success) {
      return internalError(res, new Error("Unexpected validation error"));
    }

    const validatedAddress = addressResult.data as Address;

    const bondingManagerAddress = await getBondingManagerAddress();
    const bondingVotesAddress = await getBondingVotesAddress();
    if (!bondingManagerAddress || !bondingVotesAddress) {
      throw new Error("Unsupported chain");
    }

    const [bondedAmount, , delegateAddress] = await l2PublicClient.readContract(
      {
        address: bondingManagerAddress,
        abi: bondingManager,
        functionName: "getDelegator",
        args: [validatedAddress],
      }
    );
    const isBonded = bondedAmount > 0;
    if (!isBonded) {
      const response: RegisteredToVote = {
        registered: true,
        delegate: {
          address: delegateAddress,
          registered: true,
        },
      };

      const outputResult = RegisteredToVoteSchema.safeParse(response);
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/treasury/votes/[address]/registered (unbonded)"
      );
      if (outputValidationError) return outputValidationError;

      res.setHeader("Cache-Control", getCacheControlHeader("week"));
      // we dont need to checkpoint unbonded addresses, so we consider them registered
      return res.status(200).json(response);
    }

    const registered = await l2PublicClient.readContract({
      address: bondingVotesAddress,
      abi: bondingVotes,
      functionName: "hasCheckpoint",
      args: [validatedAddress],
    });

    const delegateRegistered =
      delegateAddress === validatedAddress
        ? registered
        : await l2PublicClient.readContract({
            address: bondingVotesAddress,
            abi: bondingVotes,
            functionName: "hasCheckpoint",
            args: [delegateAddress],
          });

    res.setHeader(
      "Cache-Control",
      getCacheControlHeader(
        registered && delegateRegistered ? "week" : "revalidate"
      )
    );

    const response: RegisteredToVote = {
      registered,
      delegate: {
        address: delegateAddress,
        registered: delegateRegistered,
      },
    };

    const outputResult = RegisteredToVoteSchema.safeParse(response);
    const outputValidationError = validateOutput(
      outputResult,
      res,
      "api/treasury/votes/[address]/registered"
    );
    if (outputValidationError) return outputValidationError;

    return res.status(200).json(response);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
