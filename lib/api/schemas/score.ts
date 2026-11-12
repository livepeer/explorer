import { z } from "zod";

const MetricSchema = z.object({
  success_rate: z.number(),
  round_trip_score: z.number(),
  score: z.number(),
});

/**
 * Metrics server response: orchestrator address -> region -> metric.
 */
export const MetricsResponseSchema = z.record(
  z.string(),
  z.record(z.string(), MetricSchema).optional()
);

export const ScoreResponseSchema = z.object({
  value: z.number(),
  region: z.string(),
  model: z.string(),
  pipeline: z.string(),
  orchestrator: z.string(),
});

const PriceRowSchema = z.object({
  Address: z.string(),
  ServiceURI: z.string().optional(),
  LastRewardRound: z.number().optional(),
  RewardCut: z.number().optional(),
  FeeShare: z.number().optional(),
  DelegatedStake: z.coerce.string().optional(),
  ActivationRound: z.number().optional(),
  DeactivationRound: z.coerce.string().optional(),
  Active: z.boolean().optional(),
  Status: z.string().optional(),
  PricePerPixel: z.number(),
  UpdatedAt: z.number().optional(),
});

/**
 * Pricing server response. Invalid rows are dropped rather than failing the
 * whole response, so one malformed orchestrator does not hide every price.
 */
export const PriceResponseSchema = z.array(z.unknown()).transform((rows) =>
  rows.flatMap((row) => {
    const result = PriceRowSchema.safeParse(row);
    if (!result.success) {
      console.warn(
        "[api/score] Dropping invalid pricing row:",
        row,
        result.error.issues.map((e) => e.message).join(", ")
      );
      return [];
    }
    return [result.data];
  })
);

export const PipelineQuerySchema = z.object({
  pipeline: z.string().optional(),
  model: z.string().optional(),
});
