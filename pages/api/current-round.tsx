import { getCacheControlHeader } from "@lib/api";
import { roundsManager } from "@lib/api/abis/main/RoundsManager";
import { getRoundsManagerAddress } from "@lib/api/contracts";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { l1PublicClient, l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<CurrentRoundInfo | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("second"));

      const roundsManagerAddress = await getRoundsManagerAddress();

      const id = await l2PublicClient.readContract({
        address: roundsManagerAddress,
        abi: roundsManager,
        functionName: "currentRound",
      });
      const startBlock = await l2PublicClient.readContract({
        address: roundsManagerAddress,
        abi: roundsManager,
        functionName: "currentRoundStartBlock",
      });
      const initialized = await l2PublicClient.readContract({
        address: roundsManagerAddress,
        abi: roundsManager,
        functionName: "currentRoundInitialized",
      });

      const currentL1Block = await l1PublicClient.getBlockNumber();
      const currentL2Block = await l2PublicClient.getBlockNumber();

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
