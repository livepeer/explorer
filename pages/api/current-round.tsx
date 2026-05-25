import { getCacheControlHeader, getCurrentRound } from "@lib/api";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import { CurrentRoundInfoSchema } from "@lib/api/schemas/current-round";
import { CurrentRoundSubgraphResultSchema } from "@lib/api/schemas/subgraph";
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

      const response = await getCurrentRound();

      const subgraphValidationResult =
        CurrentRoundSubgraphResultSchema.safeParse(response);
      if (!subgraphValidationResult.success) {
        return externalApiError(
          res,
          "subgraph",
          "Invalid response structure from subgraph"
        );
      }

      const {
        data: { protocol, _meta },
      } = subgraphValidationResult.data;
      const currentRound = protocol?.currentRound;

      if (!currentRound) {
        throw new Error("No current round found");
      }

      if (!_meta?.block) {
        throw new Error("No block number found");
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

      const validationResult = CurrentRoundInfoSchema.safeParse(roundInfo);
      if (validateOutput(validationResult, res, "current-round")) {
        return;
      }

      return res.status(200).json(roundInfo);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
