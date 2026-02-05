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
import { ProposalIdSchema, ProposalStateSchema } from "@lib/api/schemas";
import { ProposalState } from "@lib/api/types/get-treasury-proposal";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const ProposalStateEnum = {
  0: "Pending",
  1: "Active",
  2: "Canceled",
  3: "Defeated",
  4: "Succeeded",
  5: "Queued",
  6: "Expired",
  7: "Executed",
} as const;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ProposalState | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("second"));

      const proposalId = req.query.proposalId?.toString();

      // ProposalIdSchema validates format (numeric string)
      const proposalIdResult = ProposalIdSchema.safeParse(proposalId);
      const inputValidationError = validateInput(
        proposalIdResult,
        res,
        "Invalid proposalId format"
      );
      if (inputValidationError) return inputValidationError;

      // TypeScript needs explicit check for type narrowing
      if (!proposalIdResult.success) {
        return internalError(res, new Error("Unexpected validation error"));
      }

      // After the success check, TypeScript knows data is defined
      const validatedProposalId: string = proposalIdResult.data;

      const livepeerGovernorAddress = await getLivepeerGovernorAddress();
      const bondingVotesAddress = await getBondingVotesAddress();
      if (!livepeerGovernorAddress || !bondingVotesAddress) {
        throw new Error("Unsupported chain");
      }

      const now = await l2PublicClient.readContract({
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "clock",
      });
      let snapshot = await l2PublicClient.readContract({
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "proposalSnapshot",
        args: [BigInt(validatedProposalId)],
      });
      // we can only fetch quorum up to past round now - 1
      if (snapshot >= now) {
        snapshot = BigInt(now - 1);
      }

      const totalVoteSupply = await l2PublicClient
        .readContract({
          address: bondingVotesAddress,
          abi: bondingVotes,
          functionName: "getPastTotalSupply",
          args: [snapshot],
        })
        .then((bn) => bn.toString());

      const votes = await l2PublicClient
        .readContract({
          address: livepeerGovernorAddress,
          abi: livepeerGovernor,
          functionName: "proposalVotes",
          args: [BigInt(validatedProposalId)],
        })
        .then((votes) => votes.map((bn) => bn.toString()));

      const state = await l2PublicClient.readContract({
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "state",
        args: [BigInt(validatedProposalId)],
      });

      const quorum = await l2PublicClient
        .readContract({
          address: livepeerGovernorAddress,
          abi: livepeerGovernor,
          functionName: "quorum",
          args: [snapshot],
        })
        .then((bn) => bn.toString());

      // This is the only function not in the original OZ Governor interface
      const quota = await l2PublicClient
        .readContract({
          address: livepeerGovernorAddress,
          abi: livepeerGovernor,
          functionName: "quota",
        })
        .then((bn) => bn.toString());

      const proposalState: ProposalState = {
        id: validatedProposalId,
        state: ProposalStateEnum[state] ?? "Unknown",
        quota,
        quorum,
        totalVoteSupply,
        votes: {
          against: votes[0],
          for: votes[1],
          abstain: votes[2],
        },
      };

      // Validate output: proposal state response
      const outputResult = ProposalStateSchema.safeParse(proposalState);
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/treasury/proposal/[proposalId]/state"
      );
      if (outputValidationError) return outputValidationError;

      return res.status(200).json(proposalState);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    console.error("state api error", err);
    return internalError(res, err);
  }
};

export default handler;
