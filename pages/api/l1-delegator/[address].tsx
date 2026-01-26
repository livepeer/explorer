import { getCacheControlHeader } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { controller } from "@lib/api/abis/main/Controller";
import { roundsManager } from "@lib/api/abis/main/RoundsManager";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import { AddressSchema, L1DelegatorSchema } from "@lib/api/schemas";
import { L1Delegator, UnbondingLock } from "@lib/api/types/get-l1-delegator";
import { CHAIN_INFO, L1_CHAIN_ID, l1PublicClient } from "@lib/chains";
import { EMPTY_ADDRESS } from "@lib/utils";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<L1Delegator | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("day"));

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

      const bondingManagerHash = keccak256(
        toUtf8Bytes("BondingManager")
      ) as Address;
      const bondingManagerAddress = await l1PublicClient.readContract({
        address: CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
        abi: controller,
        functionName: "getContract",
        args: [bondingManagerHash],
      });

      const roundsManagerHash = keccak256(
        toUtf8Bytes("RoundsManager")
      ) as Address;
      const roundsManagerAddress = await l1PublicClient.readContract({
        address: CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
        abi: controller,
        functionName: "getContract",
        args: [roundsManagerHash],
      });

      const currentRound = await l1PublicClient.readContract({
        address: roundsManagerAddress,
        abi: roundsManager,
        functionName: "currentRound",
      });

      const pendingStake = await l1PublicClient.readContract({
        address: bondingManagerAddress,
        abi: bondingManager,
        functionName: "pendingStake",
        args: [validatedAddress as Address, currentRound],
      });
      const pendingFees = await l1PublicClient.readContract({
        address: bondingManagerAddress,
        abi: bondingManager,
        functionName: "pendingFees",
        args: [validatedAddress as Address, currentRound],
      });
      const delegator = await l1PublicClient.readContract({
        address: bondingManagerAddress,
        abi: bondingManager,
        functionName: "getDelegator",
        args: [validatedAddress as Address],
      });

      let unbondingLockId = delegator[6];
      if (unbondingLockId > 0) {
        unbondingLockId -= BigInt(1);
      }

      const unbondingLocks: UnbondingLock[] = [];

      while (unbondingLockId >= 0) {
        const lock = await l1PublicClient.readContract({
          address: bondingManagerAddress,
          abi: bondingManager,
          functionName: "getDelegatorUnbondingLock",
          args: [validatedAddress as Address, unbondingLockId],
        });
        unbondingLocks.push({
          id: Number(unbondingLockId),
          amount: lock[0].toString(),
          withdrawRound: lock[1].toString(),
        });
        unbondingLockId -= BigInt(1);
      }

      const delegateAddress =
        delegator[2] === EMPTY_ADDRESS ? "" : delegator[2];

      const transcoderStatus = await l1PublicClient.readContract({
        address: bondingManagerAddress,
        abi: bondingManager,
        functionName: "transcoderStatus",
        args: [validatedAddress as Address],
      });

      const l1Delegator: L1Delegator = {
        transcoderStatus:
          transcoderStatus === 0 ? "not-registered" : "registered",
        delegateAddress,
        pendingStake: pendingStake.toString(),
        pendingFees: pendingFees.toString(),
        unbondingLocks,
        activeLocks: unbondingLocks.filter((lock) => lock.withdrawRound != "0"),
      };

      // Validate output: L1 delegator response
      const outputResult = L1DelegatorSchema.safeParse(l1Delegator);
      const validationError = validateOutput(
        outputResult,
        res,
        "api/l1-delegator"
      );
      if (validationError) return validationError;

      return res.status(200).json(l1Delegator);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
