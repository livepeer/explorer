import { z } from "zod";

/**
 * Generic Subgraph Response Schema
 * Validates the standard { data: { ... } } wrapper from The Graph
 */
export const SubgraphResponseSchema = z.object({
  data: z.record(z.string(), z.unknown()).optional(),
  errors: z.array(z.unknown()).optional(),
});

/**
 * Specific Envelope for Current Round Subgraph Query
 */
export const CurrentRoundSubgraphResultSchema = z.object({
  data: z.object({
    protocol: z
      .object({
        currentRound: z
          .object({
            id: z.string().or(z.number()),
            startBlock: z.string().or(z.number()),
            initialized: z.boolean(),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
    _meta: z
      .object({
        block: z
          .object({
            number: z.number(),
          })
          .nullable()
          .optional(),
      })
      .nullable()
      .optional(),
  }),
});

/**
 * Schema for subgraph livepeer account response
 */
export const LivepeerAccountSchema = z.object({
  id: z.string(),
});

/**
 * Schema for subgraph response structure for Livepeer Accounts
 */
export const LivepeerAccountsSubgraphSchema = z.object({
  data: z.object({
    livepeerAccounts: z.array(LivepeerAccountSchema).nullable().optional(),
  }),
});
