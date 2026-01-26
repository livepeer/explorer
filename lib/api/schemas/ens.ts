import { z } from "zod";

/**
 * ENS-related schemas
 */

/**
 * Schema for ENS identity data
 */
export const EnsIdentitySchema = z.object({
  name: z.string().nullable(),
  avatar: z.string().nullable(),
  description: z.string().nullable(),
});
