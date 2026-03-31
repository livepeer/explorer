import { z } from "zod";

export const SubgraphTotalSupplyResponseSchema = z.object({
  data: z.object({
    protocol: z.object({
      totalSupply: z.string(),
    }),
  }),
});

export const TotalTokenSupplyOutputSchema = z.number();
