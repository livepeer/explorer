import { z } from "zod";

import {
  AddressSchema,
  GithubHandleSchema,
  TwitterHandleSchema,
  WebUrlSchema,
} from "./common";

/**
 * Schema for ENS identity data
 */
export const EnsIdentitySchema = z.object({
  id: z.string(),
  idShort: z.string(),
  avatar: z.string().nullable().optional(),
  name: z.string().nullable().optional(),
  // Strict validation that falls back to null if invalid
  url: WebUrlSchema.nullable().optional().catch(null),
  twitter: TwitterHandleSchema.nullable().optional().catch(null),
  github: GithubHandleSchema.nullable().optional().catch(null),
  description: z.string().nullable().optional(),
  isLoading: z.boolean().optional(),
});

/**
 * Blacklist of addresses that should be rejected
 */
const ENS_BLACKLIST = ["0xcb69ffc06d3c218472c50ee25f5a1d3ca9650c44"].map((a) =>
  a.toLowerCase()
);

/**
 * Blacklist of ENS names that should be rejected
 */
const ENS_NAME_BLACKLIST = ["salty-minning.eth"];

/**
 * Address schema with blacklist validation for ENS endpoints
 */
export const EnsAddressSchema = AddressSchema.refine(
  (address) => !ENS_BLACKLIST.includes(address.toLowerCase()),
  {
    message: "Address is blacklisted",
  }
);

/**
 * Schema for ENS name validation (with blacklist check)
 */
export const EnsNameSchema = z
  .string()
  .min(1, "ENS name cannot be empty")
  .refine((name) => !ENS_NAME_BLACKLIST.includes(name), {
    message: "ENS name is blacklisted",
  });

/**
 * Schema for array of ENS identities
 */
export const EnsIdentityArraySchema = z.array(EnsIdentitySchema);

export const EnsAvatarResultSchema = z.string().nullable();

/**
 * Schema for ENS text record responses from provider
 * Validates that text records are strings (or null if not set)
 */
export const EnsTextRecordSchema = z.string().nullable();

/**
 * Schema for ENS avatar response from provider
 * Validates the avatar object structure returned by getAvatar()
 */
export const EnsAvatarProviderSchema = z
  .object({
    url: z.string(),
  })
  .nullable();
