import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  EventsDocument,
  EventsQuery,
  EventsQueryVariables,
} from "../../../apollo";

export const getEventsTool = tool({
  description:
    "Get recent protocol events including bonds, unbonds, rewards, ticket redemptions, and other on-chain activities. Use this when users ask about recent activity, what's happening on the network, or specific event types.",
  inputSchema: z.object({
    limit: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .describe("Number of recent transactions to fetch (default 20, max 50)"),
  }),
  execute: async ({ limit }) => {
    const client = getApollo();

    const result = await client.query<EventsQuery, EventsQueryVariables>({
      query: EventsDocument,
      variables: { first: limit },
    });

    const transactions = result.data?.transactions ?? [];
    const events: Array<{
      type: string;
      round: string;
      time: string;
      details: string;
    }> = [];

    for (const tx of transactions) {
      for (const event of tx?.events ?? []) {
        if (!event) continue;

        const typeName = event.__typename ?? "Unknown";
        const round = event.round?.id ?? "?";
        const timestamp = event.transaction?.timestamp
          ? new Date(Number(event.transaction.timestamp) * 1000).toISOString()
          : "Unknown";

        let details = "";
        switch (typeName) {
          case "BondEvent": {
            const e = event as { delegator?: { id: string }; newDelegate?: { id: string }; additionalAmount?: string };
            details = `${e.delegator?.id ?? "?"} bonded ${(Number(e.additionalAmount ?? 0) / 1e18).toFixed(2)} LPT to ${e.newDelegate?.id ?? "?"}`;
            break;
          }
          case "UnbondEvent": {
            const e = event as { delegator?: { id: string }; amount?: string };
            details = `${e.delegator?.id ?? "?"} unbonded ${(Number(e.amount ?? 0) / 1e18).toFixed(2)} LPT`;
            break;
          }
          case "RewardEvent": {
            const e = event as { delegate?: { id: string }; rewardTokens?: string };
            details = `${e.delegate?.id ?? "?"} claimed ${(Number(e.rewardTokens ?? 0) / 1e18).toFixed(2)} LPT reward`;
            break;
          }
          case "WinningTicketRedeemedEvent": {
            const e = event as { recipient?: { id: string }; faceValue?: string };
            details = `${e.recipient?.id ?? "?"} redeemed ticket worth ${(Number(e.faceValue ?? 0) / 1e18).toFixed(6)} ETH`;
            break;
          }
          case "TranscoderUpdateEvent": {
            const e = event as { delegate?: { id: string }; feeShare?: string; rewardCut?: string };
            details = `${e.delegate?.id ?? "?"} updated: fee share ${(Number(e.feeShare ?? 0) / 10000).toFixed(2)}%, reward cut ${(Number(e.rewardCut ?? 0) / 10000).toFixed(2)}%`;
            break;
          }
          case "NewRoundEvent":
            details = `New round initialized`;
            break;
          default:
            details = typeName;
        }

        events.push({ type: typeName, round, time: timestamp, details });
      }
    }

    return {
      type: "table" as const,
      title: `Recent Protocol Events (${events.length})`,
      columns: ["Type", "Round", "Time", "Details"],
      rows: events.slice(0, 30).map((e) => [e.type, e.round, e.time, e.details]),
    };
  },
});
