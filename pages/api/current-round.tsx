import { getCacheControlHeader, getCurrentRound } from "@lib/api";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { l1PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<CurrentRoundInfo | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("minute"));

      const {
        data: { protocol, _meta },
      } = await getCurrentRound();
      const currentRound = protocol?.currentRound;

      if (!currentRound) {
        return res.status(500).end("No current round found");
      }

      if (!_meta?.block) {
        return res.status(500).end("No block number found");
      }

      const { id, startBlock, initialized } = currentRound;

      const currentL2Block = _meta.block.number;
      const currentL1Block = await l1PublicClient.getBlockNumber();

      const roundInfo: CurrentRoundInfo = {
        id: Number(id),
        startBlock: Number(startBlock),
        initialized,
        currentL1Block: Number(currentL1Block),
        currentL2Block: Number(currentL2Block),
      };

      return res.status(200).json(roundInfo);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
