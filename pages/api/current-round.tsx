import { getCacheControlHeader } from "@lib/api";
import { roundsManager } from "@lib/api/abis/main/RoundsManager";
import { getContractAddress } from "@lib/api/contracts";
import { internalError, methodNotAllowed } from "@lib/api/errors";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<CurrentRoundInfo | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("minute"));

      const roundsManagerAddress = await getContractAddress("RoundsManager");

      const contract = {
        address: roundsManagerAddress,
        abi: roundsManager,
      } as const;

      const [id, startBlock, initialized, currentL1Block, currentL2Block] =
        await Promise.all([
          l2PublicClient.readContract({
            ...contract,
            functionName: "currentRound",
          }),
          l2PublicClient.readContract({
            ...contract,
            functionName: "currentRoundStartBlock",
          }),
          l2PublicClient.readContract({
            ...contract,
            functionName: "currentRoundInitialized",
          }),
          l2PublicClient.readContract({
            ...contract,
            functionName: "blockNum",
          }),
          l2PublicClient.getBlockNumber(),
        ]);

      const roundInfo: CurrentRoundInfo = {
        id: Number(id),
        startBlock: Number(startBlock),
        initialized: Boolean(initialized),
        currentL1Block: Number(currentL1Block),
        currentL2Block: Number(currentL2Block),
      };

      return res.status(200).json(roundInfo);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
