import { getCacheControlHeader } from "@lib/api";
import { proposalsDb } from "@lib/api/proposals";
import { Proposal } from "@lib/api/types/get-treasury-proposal";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse<Proposal | null>) => {
  try {
    const { method } = req;
    if (method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
    res.setHeader("Cache-Control", getCacheControlHeader("hour"));

    const proposalId = req.query.proposalId?.toString();
    if (!proposalId) {
      throw new Error("Missing proposalId");
    }

    // TODO: Implement proposal indexing using The Graph
    //
    // const livepeerGovernorAddress = await getLivepeerGovernorAddress();
    // if (!livepeerGovernorAddress) {
    //   throw new Error("Unsupported chain");
    // }

    // const proposalSnapshot = await l2PublicClient.readContract({
    //   address: livepeerGovernorAddress,
    //   abi: livepeerGovernor,
    //   functionName: "proposalSnapshot",
    //   args: [BigInt(proposalId)],
    // });

    // l2PublicClient.createContractEventFilter({
    //   abi: livepeerGovernor,
    //   address: livepeerGovernorAddress,
    //   eventName: "ProposalCreated",
    // });

    // l2PublicClient.getFilterLogs

    const proposal = proposalsDb[proposalId];
    if (!proposal) {
      return res.status(404).json(null);
    }

    return res.status(200).json({
      id: proposalId,
      ...proposal,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
