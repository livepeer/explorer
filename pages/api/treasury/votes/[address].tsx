import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { bondingCheckpointsVotes } from "@lib/api/abis/main/BondingCheckpointsVotes";
import { livepeerGovernor } from "@lib/api/abis/main/LivepeerGovernor";
import {
  getGovernorVotesAddress,
  getLivepeerGovernorAddress,
} from "@lib/api/contracts";
import {
  ProposalVotingPower,
  VotingPower,
} from "@lib/api/types/get-treasury-proposal";
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
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
    res.setHeader("Cache-Control", getCacheControlHeader("second"));

    const address = req.query.address?.toString();
    if (!isValidAddress(address)) {
      throw new Error("Missing address");
    }

    const livepeerGovernorAddress = getLivepeerGovernorAddress();
    const governorVotesAddress = getGovernorVotesAddress();
    if (!livepeerGovernorAddress || !governorVotesAddress) {
      throw new Error("Unsupported chain");
    }

    const proposalThreshold = await l2PublicClient
      .readContract({
        address: livepeerGovernorAddress,
        abi: livepeerGovernor,
        functionName: "proposalThreshold",
      })
      .then((bn) => bn.toString());

    const getVotes = async (address: Address) => {
      const votes = await l2PublicClient
        .readContract({
          address: governorVotesAddress,
          abi: bondingCheckpointsVotes,
          functionName: "getVotes",
          args: [address],
        })
        .then((bn) => bn.toString());

      return { address, votes };
    };

    const delegateAddress = await l2PublicClient.readContract({
      address: governorVotesAddress,
      abi: bondingCheckpointsVotes,
      functionName: "delegates",
      args: [address],
    });

    return res.status(200).json({
      proposalThreshold,
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
