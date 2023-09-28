import { getCacheControlHeader } from "@lib/api";
import { bondingVotes } from "@lib/api/abis/main/BondingVotes";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import {
  getBondingVotesAddress,
  getLivepeerGovernorAddress,
} from "@lib/api/contracts";
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
      args: [BigInt(proposalId)],
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
        args: [BigInt(proposalId)],
      })
      .then((votes) => votes.map((bn) => bn.toString()));

    const state = await l2PublicClient.readContract({
      address: livepeerGovernorAddress,
      abi: livepeerGovernor,
      functionName: "state",
      args: [BigInt(proposalId)],
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

    return res.status(200).json({
      id: proposalId,
      state: ProposalStateEnum[state] ?? "Unknown",
      quota,
      quorum,
      totalVoteSupply,
      votes: {
        against: votes[0],
        for: votes[1],
        abstain: votes[2],
      },
    });
  } catch (err) {
    console.error("state api error", err);
    return res.status(500).json(null);
  }
};

export default handler;
