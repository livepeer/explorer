import { isAddress } from "viem";
import { z } from "zod";

/**
 * Common schemas used across multiple API endpoints
 */

/**
 * Validates Ethereum addresses using viem.
 * Accepts valid lowercase/uppercase addresses and valid EIP-55 mixed-case addresses.
 */
export const AddressSchema = z.string().refine(isAddress, {
  message: "Invalid Ethereum address",
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
 * Schema for web URLs with an explicit http/https protocol requirement.
 */
export const WebUrlSchema = z.string().refine(
  (val) => {
    try {
      const parsedUrl = new URL(val);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Invalid URL format. Must use http or https." }
);

/**
 * Standard Twitter/X handle check: alphanumeric + underscore, max 15 chars (excludes @)
 */
export const TwitterHandleSchema = z
  .string()
  .regex(/^[A-Za-z0-9_]{1,15}$/, "Invalid Twitter handle");

/**
 * Standard GitHub handle check: alphanumeric + hyphens, max 39 chars
 */
export const GithubHandleSchema = z
  .string()
  .regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, "Invalid GitHub handle");
