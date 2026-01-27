import { z } from "zod";

/**
 * Treasury and proposal-related schemas
 */

/**
 * Validates a proposal ID (numeric string)
 */
export const ProposalIdSchema = z.string().regex(/^\d+$/, {
  message: "Proposal ID must be a numeric string",
});

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
 * Schema for proposal voting power API response
 * Matches the ProposalVotingPower type from get-treasury-proposal.ts
 */
export const ProposalVotingPowerSchema = z.object({
  self: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    votes: z.string(),
    hasVoted: z.boolean(),
  }),
  delegate: z
    .object({
      address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      votes: z.string(),
      hasVoted: z.boolean(),
    })
    .optional(),
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
