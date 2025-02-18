import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { controller } from "@lib/api/abis/main/Controller";
import { roundsManager } from "@lib/api/abis/main/RoundsManager";
import { L1Delegator, UnbondingLock } from "@lib/api/types/get-l1-delegator";
import { CHAIN_INFO, l1PublicClient, L1_CHAIN_ID } from "@lib/chains";
import { EMPTY_ADDRESS } from "@lib/utils";
import { keccak256, toUtf8Bytes } from "ethers";
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

      if (isValidAddress(address)) {
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
          args: [address as Address, currentRound],
        });
        const pendingFees = await l1PublicClient.readContract({
          address: bondingManagerAddress,
          abi: bondingManager,
          functionName: "pendingFees",
          args: [address as Address, currentRound],
        });
        const delegator = await l1PublicClient.readContract({
          address: bondingManagerAddress,
          abi: bondingManager,
          functionName: "getDelegator",
          args: [address as Address],
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
            args: [address as Address, unbondingLockId],
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
          args: [address as Address],
        });

        const l1Delegator: L1Delegator = {
          transcoderStatus:
            transcoderStatus === 0 ? "not-registered" : "registered",
          delegateAddress,
          pendingStake: pendingStake.toString(),
          pendingFees: pendingFees.toString(),
          unbondingLocks,
          activeLocks: unbondingLocks.filter(
            (lock) => lock.withdrawRound != "0"
          ),
        };

        return res.status(200).json(l1Delegator);
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
