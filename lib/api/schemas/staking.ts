import { z } from "zod";

/**
 * Staking and delegator-related schemas
 */

/**
 * Schema for pending fees and stake response
 */
export const PendingFeesAndStakeSchema = z.object({
  pendingStake: z.string(),
  pendingFees: z.string(),
});

/**
 * Schema for unbonding lock
 */
export const UnbondingLockSchema = z.object({
  id: z.number(),
  amount: z.string(),
  withdrawRound: z.string(),
});

/**
 * Schema for L1 delegator response
 */
export const L1DelegatorSchema = z.object({
  delegateAddress: z.string(),
  pendingStake: z.string(),
  pendingFees: z.string(),
  transcoderStatus: z.enum(["not-registered", "registered"]),
  unbondingLocks: z.array(UnbondingLockSchema),
  activeLocks: z.array(UnbondingLockSchema),
});
