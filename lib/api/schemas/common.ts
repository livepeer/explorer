import { z } from "zod";

/**
 * Common schemas used across multiple API endpoints
 */

/**
 * Validates Ethereum address format (0x followed by 40 hex characters)
 * This is stricter than viem's isAddress which also accepts checksummed addresses
 */
export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message:
    "Invalid address format. Must be a valid Ethereum address (0x followed by 40 hex characters)",
});

/**
 * Schema for account balance API response
 */
export const AccountBalanceSchema = z.object({
  balance: z.string(),
  allowance: z.string(),
});

/**
 * Validates a numeric string (for BigNumber values)
 */
export const NumericStringSchema = z.string().regex(/^\d+$/, {
  message: "Must be a numeric string",
});

/**
 * Validates a proposal ID (numeric string)
 */
export const ProposalIdSchema = z.string().regex(/^\d+$/, {
  message: "Proposal ID must be a numeric string",
});

/**
 * Validates optional query parameters
 */
export const OptionalStringSchema = z.string().optional();
