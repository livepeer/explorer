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
import {
  AddressSchema,
  ProposalIdSchema,
  ProposalVotingPowerSchema,
} from "@lib/api/schemas";
import { ProposalVotingPower } from "@lib/api/types/get-treasury-proposal";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ProposalVotingPower | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("second"));

      const proposalId = req.query.proposalId?.toString();
      const address = req.query.address?.toString();

      // ProposalIdSchema validates format (numeric string)
      const proposalIdResult = ProposalIdSchema.safeParse(proposalId);
      if (!proposalIdResult.success) {
        return validateInput(
          proposalIdResult,
          res,
          "Invalid proposalId format"
        );
      }

      // AddressSchema validates format
      const addressResult = AddressSchema.safeParse(address);
      if (!addressResult.success) {
        return validateInput(addressResult, res, "Invalid address format");
      }

      const validatedProposalId: string = proposalIdResult.data;
      const validatedAddress: string = addressResult.data;

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
      if (snapshot > now) {
        snapshot = BigInt(now);
      }

      const getVotes = async (address: Address) => {
        const votesProm = l2PublicClient
          .readContract({
            address: bondingVotesAddress,
            abi: bondingVotes,
            ...(snapshot < now
              ? { functionName: "getPastVotes", args: [address, snapshot] }
              : { functionName: "getVotes", args: [address] }),
          })
          .then((bn: bigint) => bn.toString());
        const hasVotedProm = l2PublicClient.readContract({
          address: livepeerGovernorAddress,
          abi: livepeerGovernor,
          functionName: "hasVoted",
          args: [BigInt(validatedProposalId), address],
        });

        const [votes, hasVoted] = await Promise.all([votesProm, hasVotedProm]);
        return { address, votes, hasVoted };
      };

      const delegateAddress = await l2PublicClient.readContract({
        address: bondingVotesAddress,
        abi: bondingVotes,
        functionName: "delegatedAt",
        args: [validatedAddress as Address, snapshot],
      });

      const votingPower: ProposalVotingPower = {
        self: await getVotes(validatedAddress as Address),
        delegate:
          delegateAddress.toLowerCase() === validatedAddress.toLowerCase()
            ? undefined
            : await getVotes(delegateAddress),
      };

      // Validate output: proposal voting power response
      const outputResult = ProposalVotingPowerSchema.safeParse(votingPower);
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/treasury/proposal/[proposalId]/votes/[address]"
      );
      if (outputValidationError) return outputValidationError;

      return res.status(200).json(votingPower);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
