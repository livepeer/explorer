import { z } from "zod";

// 500KB is plenty for a proposal and small enough to prevent abuse.
const MAX_PROPOSAL_TEXT_BYTES = 500_000;

export const UploadIpfsInputSchema = z.object({
  gitCommitHash: z
    .string()
    .regex(
      /^[a-fA-F0-9]{40}$/,
      "Must be a 40-character hexadecimal Git commit hash"
    ),
  text: z
    .string()
    .refine(
      (text) => Buffer.byteLength(text, "utf8") <= MAX_PROPOSAL_TEXT_BYTES,
      { message: `Text must be at most ${MAX_PROPOSAL_TEXT_BYTES} bytes` }
    ),
});

export const PinataPinResponseSchema = z.object({
  IpfsHash: z.string(),
});
