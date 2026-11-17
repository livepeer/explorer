import { z } from "zod";

export const RegionSchema = z.string().min(1, "Region cannot be empty");

const PipelineSchema = z.object({
  id: z.string(),
  models: z.array(z.string()),
  regions: z.array(z.string()),
});

export const AvailablePipelinesSchema = z.object({
  pipelines: z.array(PipelineSchema),
});
