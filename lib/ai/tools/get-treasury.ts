import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  TreasuryProposalsDocument,
  TreasuryProposalsQuery,
  TreasuryProposalsQueryVariables,
} from "../../../apollo";

export const getTreasuryTool = tool({
  description:
    "Get treasury governance proposals including active and past proposals. Use this when users ask about governance, treasury proposals, or voting.",
  inputSchema: z.object({}),
  execute: async () => {
    const client = getApollo();

    const result = await client.query<
      TreasuryProposalsQuery,
      TreasuryProposalsQueryVariables
    >({
      query: TreasuryProposalsDocument,
    });

    const proposals = result.data?.treasuryProposals ?? [];

    if (proposals.length === 0) {
      return {
        type: "stats" as const,
        title: "Treasury Proposals",
        stats: { Status: "No proposals found" },
      };
    }

    return {
      type: "table" as const,
      title: `Treasury Proposals (${proposals.length})`,
      columns: [
        "ID",
        "Description",
        "Proposer",
        "Vote Start",
        "Vote End",
      ],
      rows: proposals.map((p) => [
        p.id.slice(0, 10) + "...",
        (p.description ?? "No description").slice(0, 80) +
          ((p.description ?? "").length > 80 ? "..." : ""),
        p.proposer?.id ?? "Unknown",
        p.voteStart ?? "?",
        p.voteEnd ?? "?",
      ]),
    };
  },
});
