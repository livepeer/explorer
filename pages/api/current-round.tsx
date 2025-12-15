import { getCacheControlHeader } from "@lib/api";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { l1PublicClient } from "@lib/chains";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<CurrentRoundInfo | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("minute"));

      const response = await fetchWithRetry(
        CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `
              {
                _meta {
                  block {
                    number
                  }
                }
                protocol(id: "0") {
                  currentRound {
                    id
                    startBlock
                    initialized
                  }
                }
              }
            `,
          }),
        },
        {
          retryOnMethods: ["POST"],
        }
      );

      const currentL1Block = await l1PublicClient.getBlockNumber();

      const {
        data: {
          _meta: {
            block: { number: currentL2Block },
          },
          protocol: {
            currentRound: { id, startBlock, initialized },
          },
        },
      } = await response.json();

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
