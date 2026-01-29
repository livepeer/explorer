import { z } from "zod";

import { AddressSchema } from "./common";

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
  topAIScore: z.preprocess(
    (val) =>
      typeof val === "object" && val !== null && Object.keys(val).length === 0
        ? undefined
        : val,
    ScoreResponseSchema.optional().nullable()
  ),
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

/**
 * Schema for all performance metrics (record of address to performance metrics)
 */
export const AllPerformanceMetricsSchema = z.record(
  AddressSchema,
  PerformanceMetricsSchema
);

/**
 * Schema for pipeline query parameters
 */
export const PipelineQuerySchema = z.object({
  pipeline: z.string().optional(),
  model: z.string().optional(),
});
