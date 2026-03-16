import { getCacheControlHeader } from "@lib/api";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import { bondingVotes } from "@lib/api/abis/main/BondingVotes";
import {
  getBondingManagerAddress,
  getBondingVotesAddress,
} from "@lib/api/contracts";
import { badRequest, internalError, methodNotAllowed } from "@lib/api/errors";
import { RegisteredToVote } from "@lib/api/types/get-treasury-proposal";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { isAddress } from "viem";

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
    if (!(!!address && isAddress(address))) {
      return badRequest(res, "Invalid address format");
    }

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
        args: [address],
      }
    );
    const isBonded = bondedAmount > 0;
    if (!isBonded) {
      res.setHeader("Cache-Control", getCacheControlHeader("week"));
      // we dont need to checkpoint unbonded addresses, so we consider them registered
      return res.status(200).json({
        registered: true,
        delegate: {
          address: delegateAddress,
          registered: true,
        },
      });
    }

    const registered = await l2PublicClient.readContract({
      address: bondingVotesAddress,
      abi: bondingVotes,
      functionName: "hasCheckpoint",
      args: [address],
    });

    const delegateRegistered =
      delegateAddress === address
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

    return res.status(200).json({
      registered,
      delegate: {
        address: delegateAddress,
        registered: delegateRegistered,
      },
    });
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
