import { z } from "zod";

export const RegionObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["transcoding", "ai"]),
});

/**
 * Metrics server regions response. Invalid regions are dropped rather than
 * failing the whole response, so one malformed region does not hide every
 * region from that server.
 */
export const RegionsSchema = z.object({
  regions: z.array(z.unknown()).transform((regions) =>
    regions.flatMap((region) => {
      const result = RegionObjectSchema.safeParse(region);
      if (!result.success) {
        console.warn(
          "[api/regions] Dropping invalid region:",
          region,
          result.error.issues.map((e) => e.message).join(", ")
        );
        return [];
      }
      return [result.data];
    })
  ),
});
