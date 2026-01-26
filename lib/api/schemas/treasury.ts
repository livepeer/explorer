import { z } from "zod";

/**
 * Treasury and proposal-related schemas
 */

/**
 * Schema for treasury proposal state
 */
export const TreasuryProposalStateSchema = z.object({
  state: z.enum([
    "pending",
    "active",
    "canceled",
    "defeated",
    "succeeded",
    "queued",
    "expired",
    "executed",
  ]),
});

/**
 * Schema for treasury vote data
 */
export const TreasuryVoteSchema = z
  .object({
    proposalId: z.string(),
    support: z.boolean(),
    votes: z.string(),
    hasVoted: z.boolean(),
  })
  .optional();
