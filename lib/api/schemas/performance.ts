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

/**
 * Schema for regional values (key-value pairs of region to number)
 */
export const RegionalValuesSchema = z.record(z.string(), z.number());

/**
 * Schema for performance metrics response
 */
export const PerformanceMetricsSchema = z.object({
  successRates: RegionalValuesSchema,
  roundTripScores: RegionalValuesSchema,
  scores: RegionalValuesSchema,
  pricePerPixel: z.number(),
  topAIScore: ScoreResponseSchema,
});

/**
 * Schema for pipeline
 */
export const PipelineSchema = z.object({
  id: z.string(),
  models: z.array(z.string()),
  regions: z.array(z.string()),
});

/**
 * Schema for available pipelines response
 */
export const AvailablePipelinesSchema = z.object({
  pipelines: z.array(PipelineSchema),
});
