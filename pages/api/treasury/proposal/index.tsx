import { getCacheControlHeader } from "@lib/api";

import { NextApiRequest, NextApiResponse } from "next";
import { Proposal } from "@lib/api/types/get-treasury-proposal";
import { proposalsDb } from "@lib/api/proposals";

const handler = async (req: NextApiRequest, res: NextApiResponse<Proposal[] | null>) => {
  try {
    const { method } = req;
    if (method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
    res.setHeader("Cache-Control", getCacheControlHeader("second"));

    // TODO: Implement proposal indexing using The Graph

    const proposals = Object.entries(proposalsDb)
      .map(([id, prop]) => ({ id, ...prop }))
      .sort((a, b) => b.voteStart - a.voteStart);
    return res.status(200).json(proposals);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
