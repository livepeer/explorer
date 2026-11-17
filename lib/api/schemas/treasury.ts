import { z } from "zod";

const MAX_UINT256 = 2n ** 256n - 1n;

/**
 * Validates a proposal ID: a numeric string that fits in a uint256, since it is
 * ABI-encoded for the governor contract calls.
 */
export const ProposalIdSchema = z
  .string()
  // Abort so BigInt() below only sees digits.
  .regex(/^\d+$/, {
    message: "Proposal ID must be a numeric string",
    abort: true,
  })
  .refine((id) => BigInt(id) <= MAX_UINT256, {
    message: "Proposal ID must fit in a uint256",
  });
