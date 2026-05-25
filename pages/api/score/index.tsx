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
  AllPerformanceMetricsSchema,
  MetricsResponseSchema,
  PipelineQuerySchema,
  PriceResponseSchema,
} from "@lib/api/schemas";
import {
  AllPerformanceMetrics,
  RegionalValues,
} from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { avg } from "@lib/utils";
import { NextApiRequest, NextApiResponse } from "next";

import { MetricsResponse } from "./[address]";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AllPerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const queryResult = PipelineQuerySchema.safeParse(req.query);
      const inputValidationError = validateInput(
        queryResult,
        res,
        "Invalid query parameters"
      );
      if (inputValidationError) return inputValidationError;

      const { pipeline, model } = queryResult.data || {};

      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      if (pipeline && !process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL) {
        console.error("NEXT_PUBLIC_AI_METRICS_SERVER_URL is not set");
        return externalApiError(
          res,
          "AI metrics server",
          "NEXT_PUBLIC_AI_METRICS_SERVER_URL environment variable is not configured"
        );
      }

      if (!pipeline && !process.env.NEXT_PUBLIC_METRICS_SERVER_URL) {
        console.error("NEXT_PUBLIC_METRICS_SERVER_URL is not set");
        return externalApiError(
          res,
          "metrics server",
          "NEXT_PUBLIC_METRICS_SERVER_URL environment variable is not configured"
        );
      }

      const baseUrl = pipeline
        ? process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL
        : process.env.NEXT_PUBLIC_METRICS_SERVER_URL;
      const metricsService = pipeline ? "AI metrics server" : "metrics server";
      const metricsUrl = `${baseUrl}/api/aggregated_stats${
        pipeline ? `?pipeline=${pipeline}${model ? `&model=${model}` : ""}` : ""
      }`;

      const metricsResponse = await fetchWithRetry(metricsUrl);

      if (!metricsResponse.ok) {
        const errorText = await metricsResponse.text();
        console.error(
          "Metrics fetch error:",
          metricsResponse.status,
          errorText,
          `URL: ${metricsUrl}`
        );
        return externalApiError(res, metricsService, "Fetch failed");
      }

      const metricsJson = await metricsResponse.json();

      const metrics = validateExternalResponse(
        MetricsResponseSchema.safeParse(metricsJson),
        "api/score",
        `URL: ${metricsUrl}`
      );
      if (!metrics) {
        return externalApiError(
          res,
          metricsService,
          `Invalid response structure from ${metricsService}`
        );
      }

      const response = await fetchWithRetry(
        CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl
      );
      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "Pricing fetch error:",
          response.status,
          errorText,
          `URL: ${CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl}`
        );
        return externalApiError(res, "pricing server", "Fetch failed");
      }

      const transcodersWithPrice = validateExternalResponse(
        PriceResponseSchema.safeParse(await response.json()),
        "api/score",
        `URL: ${CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl}`
      );
      if (!transcodersWithPrice) {
        return externalApiError(
          res,
          "pricing server",
          "Invalid response structure from pricing server"
        );
      }

      const allTranscoderIds = Object.keys(metrics);
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
        metricKey: string,
        transcoderId: string,
        metrics: MetricsResponse
      ) => {
        const metricsObject: RegionalValues = uniqueRegions.reduce(
          (acc, metricsRegionKey) => {
            const metricsParentField =
              metrics[transcoderId]?.[metricsRegionKey] ?? {};
            const val = metricsParentField?.[metricKey];
            if (val !== null && val !== "")
              acc[metricsRegionKey] =
                (metricsParentField?.[metricKey] ?? 0) * 100;
            return acc;
          },
          {} as RegionalValues
        );

        // Define a global key that is the average of the other keys
        const globalValue = avg(metrics[transcoderId], metricKey) * 100;
        const finalMetricsObject: RegionalValues = {
          ...metricsObject,
          GLOBAL: globalValue,
        };
        return finalMetricsObject;
      };

      const combined: AllPerformanceMetrics = allTranscoderIds.reduce(
        (prev, transcoderId) => ({
          ...prev,
          [transcoderId]: {
            pricePerPixel:
              transcodersWithPrice.find(
                (t) => t.Address.toLowerCase() === transcoderId
              )?.PricePerPixel ?? 0,
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
          },
        }),
        {}
      );

      const outputValidationError = validateOutput(
        AllPerformanceMetricsSchema.safeParse(combined),
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
