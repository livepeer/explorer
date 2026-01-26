import { z } from "zod";

/**
 * Validates Ethereum address format (0x followed by 40 hex characters)
 * This is stricter than viem's isAddress which also accepts checksummed addresses
 */
export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message:
    "Invalid address format. Must be a valid Ethereum address (0x followed by 40 hex characters)",
});
