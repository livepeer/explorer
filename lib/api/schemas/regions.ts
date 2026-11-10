import { z } from "zod";

export const RegionObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["transcoding", "ai"]),
});

export const RegionsSchema = z.object({
  regions: z.array(RegionObjectSchema),
});
