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
 * Schema for proposal state API response
 * Matches the ProposalState type from get-treasury-proposal.ts
 */
export const ProposalStateSchema = z.object({
  id: z.string(),
  state: z.enum([
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed",
    "Unknown",
  ]),
  quota: z.string(),
  quorum: z.string(),
  totalVoteSupply: z.string(),
  votes: z.object({
    against: z.string(),
    for: z.string(),
    abstain: z.string(),
  }),
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
