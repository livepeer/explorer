import { getCacheControlHeader } from "@lib/api";
import { getRoundsManager } from "@lib/api/contracts";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { l1Provider } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<CurrentRoundInfo | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("second"));

      const roundsManager = await getRoundsManager();

      const id = await roundsManager.currentRound();
      const startBlock = await roundsManager.currentRoundStartBlock();
      const initialized = await roundsManager.currentRoundInitialized();

      const currentL1Block = await l1Provider.getBlockNumber();

      const roundInfo: CurrentRoundInfo = {
        id: id.toNumber(),
        startBlock: startBlock.toNumber(),
        initialized,
        currentL1Block,
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
