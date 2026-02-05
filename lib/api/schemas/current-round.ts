import { z } from "zod";

export const CurrentRoundInfoSchema = z.object({
  id: z.number(),
  startBlock: z.number(),
  initialized: z.boolean(),
  currentL1Block: z.number(),
  currentL2Block: z.number(),
});
