import { z } from "zod";

/**
 * Performance metrics and scoring schemas
 */

/**
 * Schema for performance metrics
 */
export const MetricSchema = z.object({
  success_rate: z.number(),
  round_trip_score: z.number(),
  score: z.number(),
});

/**
 * Schema for metrics response (nested record structure)
 */
export const MetricsResponseSchema = z.record(
  z.string(),
  z.record(z.string(), MetricSchema).optional()
);

/**
 * Schema for score response
 */
export const ScoreResponseSchema = z.object({
  value: z.number(),
  region: z.string(),
  model: z.string(),
  pipeline: z.string(),
  orchestrator: z.string(),
});
