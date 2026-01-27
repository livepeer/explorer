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
 * Validates optional query parameters
 */
export const OptionalStringSchema = z.string().optional();

/**
 * Validates a region string (non-empty)
 */
export const RegionSchema = z.string().min(1, "Region cannot be empty");

/**
 * Schema for a single region object
 */
export const RegionObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["transcoding", "ai"]),
});

/**
 * Schema for regions API response
 */
export const RegionsSchema = z.object({
  regions: z.array(RegionObjectSchema),
});

/**
 * Schema for subgraph livepeer account response
 */
export const LivepeerAccountSchema = z.object({
  id: z.string(),
});

/**
 * Schema for subgraph response structure
 */
export const SubgraphResponseSchema = z.object({
  data: z.object({
    livepeerAccounts: z.array(LivepeerAccountSchema).nullable().optional(),
  }),
});
