import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { bondingCheckpointsVotes } from "@lib/api/abis/main/BondingCheckpointsVotes";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import {
  getGovernorVotesAddress,
  getLivepeerGovernorAddress,
} from "@lib/api/contracts";
import { ProposalVotingPower } from "@lib/api/types/get-treasury-proposal";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ProposalVotingPower | null>
) => {
  try {
    const { method } = req;
    if (method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
    res.setHeader("Cache-Control", getCacheControlHeader("second"));

    const proposalId = req.query.proposalId?.toString();
    if (!proposalId) {
      throw new Error("Missing proposalId");
    }
    const address = req.query.address?.toString();
    if (!isValidAddress(address)) {
      throw new Error("Missing address");
    }

    const livepeerGovernorAddress = getLivepeerGovernorAddress();
    const governorVotesAddress = getGovernorVotesAddress();
    if (!livepeerGovernorAddress || !governorVotesAddress) {
      throw new Error("Unsupported chain");
    }

    const now = await l2PublicClient.readContract({
      address: livepeerGovernorAddress,
      abi: livepeerGovernor,
      functionName: "clock",
    });
    const snapshot = await l2PublicClient.readContract({
      address: livepeerGovernorAddress,
      abi: livepeerGovernor,
      functionName: "proposalSnapshot",
      args: [BigInt(proposalId)],
    });

    const getVotes = async (address: Address) => {
      const votesProm = l2PublicClient
        .readContract({
          address: governorVotesAddress,
          abi: bondingCheckpointsVotes,
          ...(now >= snapshot
            ? {
                functionName: "getPastVotes",
                args: [address, snapshot],
              }
            : {
                functionName: "getVotes",
                args: [address],
              }),
        })
        .then((bn) => bn.toString());
      const hasVotedProm = l2PublicClient.readContract({
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "hasVoted",
        args: [BigInt(proposalId), address],
      });

      const [votes, hasVoted] = await Promise.all([votesProm, hasVotedProm]);
      return { address, votes, hasVoted };
    };

    const delegateAddress = await l2PublicClient.readContract({
      address: governorVotesAddress,
      abi: bondingCheckpointsVotes,
      ...(now >= snapshot
        ? {
            functionName: "delegatedAt",
            args: [address, snapshot],
          }
        : {
            functionName: "delegates",
            args: [address],
          }),
    });

    return res.status(200).json({
      self: await getVotes(address),
      delegate:
        delegateAddress.toLowerCase() === address.toLowerCase()
          ? undefined
          : await getVotes(delegateAddress),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
