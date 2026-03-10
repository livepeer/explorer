import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  CurrentRoundDocument,
  CurrentRoundQuery,
  CurrentRoundQueryVariables,
  OrchestratorsDocument,
  OrchestratorsQuery,
  OrchestratorsQueryVariables,
} from "../../../apollo";

export const getOrchestratorsTool = tool({
  description:
    "Get a list of active orchestrators on the Livepeer network, including their stake, fees, and delegation info. Use this when users ask about top orchestrators, who to delegate to, or orchestrator rankings.",
  inputSchema: z.object({
    top: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(10)
      .describe("Number of orchestrators to return (default 10, max 100)"),
    sortBy: z
      .enum(["stake", "fees"])
      .optional()
      .default("fees")
      .describe(
        "Sort orchestrators by total stake or by 30-day fees volume (default: fees)"
      ),
  }),
  execute: async ({ top, sortBy }) => {
    const client = getApollo();

    const roundResult = await client.query<
      CurrentRoundQuery,
      CurrentRoundQueryVariables
    >({
      query: CurrentRoundDocument,
    });

    const currentRoundId = roundResult.data?.protocol?.currentRound?.id;

    const result = await client.query<
      OrchestratorsQuery,
      OrchestratorsQueryVariables
    >({
      query: OrchestratorsDocument,
      variables: {
        currentRound: currentRoundId,
        currentRoundString: currentRoundId,
        first: top,
        orderBy:
          sortBy === "stake"
            ? ("totalStake" as never)
            : ("thirtyDayVolumeETH" as never),
        orderDirection: "desc" as never,
      },
    });

    const orchestrators = result.data?.transcoders ?? [];

    return {
      type: "table" as const,
      title: `Top ${top} Orchestrators by ${sortBy === "stake" ? "Stake" : "30-Day Fees"}`,
      columns: [
        "Rank",
        "Address",
        "Total Stake (LPT)",
        "30d Volume (ETH)",
        "Fee Share",
        "Reward Cut",
        "Delegators",
      ],
      rows: orchestrators.map((o, i) => [
        i + 1,
        o.id,
        (Number(o.totalStake) / 1e18).toFixed(2),
        Number(o.thirtyDayVolumeETH).toFixed(4),
        `${(Number(o.feeShare) / 10000).toFixed(2)}%`,
        `${(Number(o.rewardCut) / 10000).toFixed(2)}%`,
        o.delegators?.length ?? 0,
      ]),
    };
  },
});
