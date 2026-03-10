import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  AccountDocument,
  AccountQuery,
  AccountQueryVariables,
} from "../../../apollo";

export const getOrchestratorTool = tool({
  description:
    "Get detailed information about a specific orchestrator by their Ethereum address. Use this when users ask about a particular orchestrator's stats, fees, rewards, or configuration.",
  inputSchema: z.object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address")
      .transform((v) => v.toLowerCase())
      .describe("The Ethereum address of the orchestrator"),
  }),
  execute: async ({ address }) => {
    const client = getApollo();

    const result = await client.query<AccountQuery, AccountQueryVariables>({
      query: AccountDocument,
      variables: { account: address },
    });

    const transcoder = result.data?.transcoder;
    if (!transcoder) {
      return {
        type: "error" as const,
        message: `No orchestrator found at address ${address}`,
      };
    }

    const rewardHistory =
      transcoder.pools?.map((p) => Number(p?.rewardTokens ?? 0) / 1e18) ?? [];

    return {
      type: "stats" as const,
      title: `Orchestrator ${address}`,
      stats: {
        Active: transcoder.active ? "Yes" : "No",
        "Total Stake (LPT)": (
          Number(transcoder.totalStake) / 1e18
        ).toFixed(2),
        "Fee Share": `${(Number(transcoder.feeShare) / 10000).toFixed(2)}%`,
        "Reward Cut": `${(Number(transcoder.rewardCut) / 10000).toFixed(2)}%`,
        "30d Volume (ETH)": Number(
          transcoder.thirtyDayVolumeETH
        ).toFixed(4),
        "90d Volume (ETH)": Number(
          transcoder.ninetyDayVolumeETH
        ).toFixed(4),
        "Total Volume (ETH)": Number(
          transcoder.totalVolumeETH
        ).toFixed(4),
        Delegators: transcoder.delegators?.length ?? 0,
        "Recent Avg Reward (LPT)":
          rewardHistory.length > 0
            ? (
                rewardHistory.reduce((a, b) => a + b, 0) /
                rewardHistory.length
              ).toFixed(4)
            : "N/A",
      },
    };
  },
});
