import { z } from "zod";

const PollProposalSchema = z.object({
  gitCommitHash: z
    .string()
    .regex(
      /^[a-fA-F0-9]{40}$/,
      "Must be a 40-character hexadecimal Git commit hash"
    ),
  // Limit text to 500KB (500,000 characters) - plenty for a proposal, small enough to prevent abuse
  text: z.string().max(500000),
});

export const UploadIpfsInputSchema = PollProposalSchema;

export const PinataPinResponseSchema = z.object({
  IpfsHash: z.string(),
});

export const UploadIpfsOutputSchema = z.object({
  hash: z.string(),
});
