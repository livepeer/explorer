import { getCacheControlHeader } from "@lib/api";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateExternalResponse,
  validateInput,
  validateOutput,
} from "@lib/api/errors";
import {
  AddressSchema,
  MetricsResponseSchema,
  PerformanceMetricsSchema,
  PriceResponseSchema,
  ScoreResponseSchema,
} from "@lib/api/schemas";
import {
  PerformanceMetrics,
  RegionalValues,
} from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { avg, checkAddressEquality } from "@lib/utils";
import { NextApiRequest, NextApiResponse } from "next";

type Metric = {
  success_rate: number;
  round_trip_score: number;
  score: number;
};

export type MetricsResponse = {
  [key: string]:
    | {
        [key: string]: Metric;
      }
    | undefined;
};

export type PriceResponse = {
  Address: string;
  ServiceURI: string;
  LastRewardRound: number;
  RewardCut: number;
  FeeShare: number;
  DelegatedStake: string;
  ActivationRound: number;
  DeactivationRound: string;
  Active: boolean;
  Status: string;
  PricePerPixel: number;
  UpdatedAt: number;
}[];

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      const { address } = req.query;

      // AddressSchema handles undefined, arrays, and validates format
      const addressResult = AddressSchema.safeParse(address);
      if (!addressResult.success) {
        return validateInput(addressResult, res, "Invalid address format");
      }

      const transcoderId = addressResult.data.toLowerCase();
      const aiMetricsServerUrl = process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL;
      const metricsServerUrl = process.env.NEXT_PUBLIC_METRICS_SERVER_URL;

      if (!aiMetricsServerUrl) {
        console.error("NEXT_PUBLIC_AI_METRICS_SERVER_URL is not set");
        return externalApiError(
          res,
          "AI metrics server",
          "NEXT_PUBLIC_AI_METRICS_SERVER_URL environment variable is not configured"
        );
      }

      if (!metricsServerUrl) {
        console.error("NEXT_PUBLIC_METRICS_SERVER_URL is not set");
        return externalApiError(
          res,
          "metrics server",
          "NEXT_PUBLIC_METRICS_SERVER_URL environment variable is not configured"
        );
      }

      const topScoreUrl = `${aiMetricsServerUrl}/api/top_ai_score?orchestrator=${transcoderId}`;
      const metricsUrl = `${metricsServerUrl}/api/aggregated_stats?orchestrator=${transcoderId}`;
      const pricingUrl = `${CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl}?excludeUnavailable=False`;

      const [topScoreResponse, metricsResponse, priceResponse] =
        await Promise.all([
          fetchWithRetry(topScoreUrl),
          fetchWithRetry(metricsUrl),
          fetchWithRetry(pricingUrl),
        ]);

      if (!topScoreResponse.ok) {
        const errorText = await topScoreResponse.text();
        console.error(
          "Top AI score fetch error:",
          topScoreResponse.status,
          errorText,
          `URL: ${topScoreUrl}`
        );
        return externalApiError(
          res,
          "AI metrics server",
          `Status ${topScoreResponse.status}: ${errorText}`
        );
      }

      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error(
          "Metrics fetch error:",
          metricsResponse.status,
          errorText,
          `URL: ${metricsUrl}`
        );
        return externalApiError(
          res,
          "metrics server",
          `Status ${metricsResponse.status}: ${errorText}`
        );
      }

      if (!priceResponse.ok) {
        const errorText = await priceResponse.text();
        console.error(
          "Transcoder price fetch error:",
          priceResponse.status,
          errorText
        );
        return externalApiError(res, "pricing server");
      }

      const topAIScore = validateExternalResponse(
        ScoreResponseSchema.safeParse(await topScoreResponse.json()),
        "api/score/[address]",
        `URL: ${topScoreUrl}`
      );
      if (!topAIScore) {
        return externalApiError(
          res,
          "AI metrics server",
          "Invalid response structure from AI metrics server"
        );
      }

      const metrics = validateExternalResponse(
        MetricsResponseSchema.safeParse(await metricsResponse.json()),
        "api/score/[address]",
        `URL: ${metricsUrl}`
      );
      if (!metrics) {
        return externalApiError(
          res,
          "metrics server",
          "Invalid response structure from metrics server"
        );
      }

      const transcodersWithPrice = validateExternalResponse(
        PriceResponseSchema.safeParse(await priceResponse.json()),
        "api/score/[address]",
        `URL: ${pricingUrl}`
      );
      if (!transcodersWithPrice) {
        return externalApiError(
          res,
          "pricing server",
          "Invalid response structure from pricing server"
        );
      }

      const transcoderWithPrice = transcodersWithPrice.find((t) =>
        checkAddressEquality(t.Address, transcoderId)
      );

      const uniqueRegions = (() => {
        const keys = new Set<string>();
        Object.values(metrics).forEach((metric) => {
          if (metric) {
            Object.keys(metric).forEach((key) => keys.add(key));
          }
        });
        return Array.from(keys);
      })();

      const createMetricsObject = (
        metricKey: keyof Metric,
        transcoderId: string,
        metrics: MetricsResponse
      ): RegionalValues => {
        const metricsObject: RegionalValues = uniqueRegions.reduce(
          (acc, metricsRegionKey) => {
            const value =
              metrics[transcoderId]?.[metricsRegionKey]?.[metricKey];
            if (value !== null && value !== undefined) {
              acc[metricsRegionKey] = value * 100;
            }
            return acc;
          },
          {} as RegionalValues
        );

        const globalValue = avg(metrics[transcoderId], metricKey) * 100;

        return {
          ...metricsObject,
          GLOBAL: globalValue,
        };
      };

      const combined: PerformanceMetrics = {
        pricePerPixel: transcoderWithPrice?.PricePerPixel ?? 0,
        successRates: createMetricsObject(
          "success_rate",
          transcoderId,
          metrics
        ),
        roundTripScores: createMetricsObject(
          "round_trip_score",
          transcoderId,
          metrics
        ),
        scores: createMetricsObject("score", transcoderId, metrics),
        topAIScore,
      };

      // Validate output: performance metrics response
      const outputResult = PerformanceMetricsSchema.safeParse(combined);
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/score"
      );
      if (outputValidationError) return outputValidationError;

      return res.status(200).json(combined);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
