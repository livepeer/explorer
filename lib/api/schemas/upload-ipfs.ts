import { z } from "zod";

const PollProposalSchema = z.object({
  gitCommitHash: z.string().length(40),
  // Limit text to 500KB (500,000 characters) - plenty for a proposal, small enough to prevent abuse
  text: z.string().max(500000),
});

export const UploadIpfsInputSchema = z.union([PollProposalSchema, z.never()]);

export const PinataPinResponseSchema = z.object({
  IpfsHash: z.string(),
});

export const UploadIpfsOutputSchema = z.object({
  hash: z.string(),
});
