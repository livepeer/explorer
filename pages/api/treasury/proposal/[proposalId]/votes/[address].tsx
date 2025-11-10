import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { bondingVotes } from "@lib/api/abis/main/BondingVotes";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import {
  getBondingVotesAddress,
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
        .then((bn: any) => bn.toString());
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
      address: bondingVotesAddress,
      abi: bondingVotes,
      functionName: "delegatedAt",
      args: [address, snapshot],
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
