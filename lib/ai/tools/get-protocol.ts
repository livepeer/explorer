import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  ProtocolDocument,
  ProtocolQuery,
  ProtocolQueryVariables,
} from "../../../apollo";

export const getProtocolStatsTool = tool({
  description:
    "Get overall Livepeer protocol statistics including participation rate, inflation, total stake, total supply, active orchestrator count, and delegator count. Use this when users ask about protocol health, network stats, or general Livepeer metrics.",
  inputSchema: z.object({}),
  execute: async () => {
    const client = getApollo();

    const result = await client.query<ProtocolQuery, ProtocolQueryVariables>({
      query: ProtocolDocument,
    });

    const protocol = result.data?.protocol;
    if (!protocol) {
      return {
        type: "error" as const,
        message: "Could not fetch protocol data",
      };
    }

    return {
      type: "stats" as const,
      title: "Livepeer Protocol Stats",
      stats: {
        "Current Round": protocol.currentRound?.id ?? "Unknown",
        "Participation Rate": `${(Number(protocol.participationRate) * 100).toFixed(2)}%`,
        Inflation: `${(Number(protocol.inflation) / 1e7).toFixed(4)}%`,
        "Inflation Change": `${(Number(protocol.inflationChange) / 1e7).toFixed(6)}%`,
        "Total Active Stake (LPT)": (
          Number(protocol.totalActiveStake) / 1e18
        ).toFixed(0),
        "Total Supply (LPT)": (
          Number(protocol.totalSupply) / 1e18
        ).toFixed(0),
        "Active Orchestrators": protocol.activeTranscoderCount ?? 0,
        "Total Delegators": protocol.delegatorsCount ?? 0,
        "Total Volume (USD)": `$${Number(protocol.totalVolumeUSD).toFixed(2)}`,
        "Total Volume (ETH)": `${Number(protocol.totalVolumeETH).toFixed(4)} ETH`,
        "LPT Price (ETH)": `${Number(protocol.lptPriceEth).toFixed(6)} ETH`,
        "Round Length (blocks)": protocol.roundLength ?? "Unknown",
        "Lock Period (rounds)": protocol.lockPeriod ?? "Unknown",
        Paused: protocol.paused ? "Yes" : "No",
      },
    };
  },
});
