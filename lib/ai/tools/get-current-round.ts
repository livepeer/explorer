import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  CurrentRoundDocument,
  CurrentRoundQuery,
  CurrentRoundQueryVariables,
} from "../../../apollo";

export const getCurrentRoundTool = tool({
  description:
    "Get information about the current Livepeer round, including round number, start block, and initialization status. Use this when users ask about the current round or round timing.",
  inputSchema: z.object({}),
  execute: async () => {
    const client = getApollo();

    const result = await client.query<
      CurrentRoundQuery,
      CurrentRoundQueryVariables
    >({
      query: CurrentRoundDocument,
    });

    const round = result.data?.protocol?.currentRound;
    const blockNumber = result.data?._meta?.block?.number;

    if (!round) {
      return {
        type: "error" as const,
        message: "Could not fetch current round data",
      };
    }

    return {
      type: "stats" as const,
      title: "Current Round",
      stats: {
        "Round Number": round.id ?? "Unknown",
        Initialized: round.initialized ? "Yes" : "No",
        "Start Block": round.startBlock ?? "Unknown",
        "Current L2 Block": blockNumber ?? "Unknown",
      },
    };
  },
});
