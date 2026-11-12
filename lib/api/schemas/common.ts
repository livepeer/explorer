import { isAddress } from "viem";
import { z } from "zod";

/**
 * Shared primitives used by more than one API route.
 */

/**
 * Validates Ethereum addresses using viem.
 * Accepts valid lowercase/uppercase addresses and valid EIP-55 mixed-case addresses.
 */
export const AddressSchema = z.string().refine(isAddress, {
  message: "Invalid Ethereum address",
});
