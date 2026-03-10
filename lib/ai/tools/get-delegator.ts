import { tool } from "ai";
import { z } from "zod";

import { getApollo } from "../../../apollo";
import {
  AccountDocument,
  AccountQuery,
  AccountQueryVariables,
} from "../../../apollo";

export const getDelegatorTool = tool({
  description:
    "Get information about a specific delegator including their bonded amount, delegate (orchestrator), and unbonding locks. Use this when users ask about a delegator's staking position.",
  inputSchema: z.object({
    address: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address")
      .transform((v) => v.toLowerCase())
      .describe("The Ethereum address of the delegator"),
  }),
  execute: async ({ address }) => {
    const client = getApollo();

    const result = await client.query<AccountQuery, AccountQueryVariables>({
      query: AccountDocument,
      variables: { account: address },
    });

    const delegator = result.data?.delegator;
    if (!delegator) {
      return {
        type: "error" as const,
        message: `No delegator found at address ${address}`,
      };
    }

    const pendingUnbonds =
      delegator.unbondingLocks?.filter(
        (lock) => lock && Number(lock.amount) > 0
      ) ?? [];

    return {
      type: "stats" as const,
      title: `Delegator ${address}`,
      stats: {
        "Bonded Amount (LPT)": (
          Number(delegator.bondedAmount) / 1e18
        ).toFixed(2),
        "Principal (LPT)": (Number(delegator.principal) / 1e18).toFixed(2),
        "Delegate (Orchestrator)": delegator.delegate?.id ?? "None",
        "Delegate Active": delegator.delegate?.active ? "Yes" : "No",
        "Start Round": delegator.startRound ?? "N/A",
        "Last Claim Round": delegator.lastClaimRound?.id ?? "N/A",
        "Pending Unbonds": pendingUnbonds.length,
        "Total Unbonding (LPT)": pendingUnbonds
          .reduce((sum, lock) => sum + Number(lock?.amount ?? 0), 0)
          .toFixed(2),
      },
    };
  },
});
