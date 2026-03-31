import { getCacheControlHeader } from "@lib/api";
import { bondingVotes } from "@lib/api/abis/main/BondingVotes";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import {
  getBondingVotesAddress,
  getLivepeerGovernorAddress,
} from "@lib/api/contracts";
import {
  internalError,
  methodNotAllowed,
  validateInput,
  validateOutput,
} from "@lib/api/errors";
import { AddressSchema, VotingPowerSchema } from "@lib/api/schemas";
import { VotingPower } from "@lib/api/types/get-treasury-proposal";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<VotingPower | null>
) => {
  try {
    const { method } = req;
    if (method !== "GET") {
      return methodNotAllowed(res, method ?? "unknown", ["GET"]);
    }
    res.setHeader("Cache-Control", getCacheControlHeader("second"));

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

    const livepeerGovernorAddress = await getLivepeerGovernorAddress();
    const bondingVotesAddress = await getBondingVotesAddress();
    if (!livepeerGovernorAddress || !bondingVotesAddress) {
      throw new Error("Unsupported chain");
    }

    const proposalThreshold = await l2PublicClient
      .readContract({
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "proposalThreshold",
      })
      .then((bn) => bn.toString());
    const currentRound = await l2PublicClient.readContract({
      address: livepeerGovernorAddress,
      abi: livepeerGovernor,
      functionName: "clock",
    });

    const getVotes = async (addr: Address) => {
      const votes = await l2PublicClient
        .readContract({
          address: bondingVotesAddress,
          abi: bondingVotes,
          functionName: "getPastVotes",
          args: [addr, BigInt(currentRound - 1)],
        })
        .then((bn) => bn.toString());

      return { address: addr, votes };
    };

    const delegateAddress = await l2PublicClient.readContract({
      address: bondingVotesAddress,
      abi: bondingVotes,
      functionName: "delegates",
      args: [validatedAddress],
    });

    const votingPower: VotingPower = {
      proposalThreshold,
      self: await getVotes(validatedAddress),
      delegate:
        delegateAddress.toLowerCase() === validatedAddress.toLowerCase()
          ? undefined
          : await getVotes(delegateAddress),
    };

    const outputResult = VotingPowerSchema.safeParse(votingPower);
    const outputValidationError = validateOutput(
      outputResult,
      res,
      "api/treasury/votes/[address]"
    );
    if (outputValidationError) return outputValidationError;

    return res.status(200).json(votingPower);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
