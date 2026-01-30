import { z } from "zod";

export const GenerateProofInputSchema = z.object({
  account: z.string(),
  delegate: z.string(),
  stake: z.string(),
  fees: z.string(),
});

export const GenerateProofOutputSchema = z.array(z.string());
