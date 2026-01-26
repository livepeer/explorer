import { z } from "zod";

/**
 * Common schemas used across multiple API endpoints
 */

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
