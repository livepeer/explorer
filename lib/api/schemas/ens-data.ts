import { normalize } from "viem/ens";
import { z } from "zod";

import { AddressSchema } from "./common";

/**
 * Web URLs with an explicit http/https protocol.
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

/**
 * ENS text records are strings, or null when unset.
 */
export const EnsTextRecordSchema = z.string().nullable();

const ENS_ADDRESS_BLACKLIST = ["0xcb69ffc06d3c218472c50ee25f5a1d3ca9650c44"];
const ENS_NAME_BLACKLIST = ["salty-minning.eth"];

/**
 * Address with blacklist validation for ENS endpoints.
 */
export const EnsAddressSchema = AddressSchema.refine(
  (address) => !ENS_ADDRESS_BLACKLIST.includes(address.toLowerCase()),
  { message: "Address is blacklisted" }
);

/**
 * ENS name, normalized. Names that cannot be normalized are rejected here so
 * they get a 400 rather than failing later, and the blacklist is checked
 * against the normalized form.
 */
export const EnsNameSchema = z
  .string()
  .min(1, "ENS name cannot be empty")
  .transform((name, ctx) => {
    try {
      return normalize(name);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid ENS name" });
      return z.NEVER;
    }
  })
  .refine((name) => !ENS_NAME_BLACKLIST.includes(name), {
    message: "ENS name is blacklisted",
  });

/**
 * Subgraph response for the most recently updated Livepeer accounts.
 */
export const LivepeerAccountsSubgraphSchema = z.object({
  data: z.object({
    livepeerAccounts: z
      .array(z.object({ id: z.string() }))
      .nullable()
      .optional(),
  }),
});
