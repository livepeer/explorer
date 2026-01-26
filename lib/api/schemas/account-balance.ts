import { z } from "zod";

/**
 * Schema for account balance API response
 */
export const AccountBalanceSchema = z.object({
  balance: z.string(),
  allowance: z.string(),
});
