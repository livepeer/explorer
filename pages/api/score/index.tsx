import { getCacheControlHeader } from "@lib/api";
import {
  AllPerformanceMetrics, RegionalValues
} from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { avg } from "@lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { MetricsResponse, PriceResponse } from "./[address]";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AllPerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { pipeline, model } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      const baseUrl = pipeline
        ? process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL
        : process.env.NEXT_PUBLIC_METRICS_SERVER_URL;

      const metricsResponse = await fetch(
        `${baseUrl}/api/aggregated_stats${pipeline ? `?pipeline=${pipeline}${model ? `&model=${model}` : ""}` : ""}`
      ).then((res) => res.json());

      const metrics: MetricsResponse = await metricsResponse;
      const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl);
      const transcodersWithPrice: PriceResponse = await response.json();

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
        const metricsObject: RegionalValues = uniqueRegions.reduce((acc, metricsRegionKey) => {
          const metricsParentField = metrics[transcoderId]?.[metricsRegionKey] ?? {};
          const val = metricsParentField?.[metricKey];
          if (val !== null && val !== "")
            acc[metricsRegionKey] = (metricsParentField?.[metricKey] ?? 0) * 100;
          return acc;
        }, {} as RegionalValues);

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
              transcodersWithPrice?.find(
                (t) => t.Address.toLowerCase() === transcoderId
              ) ?? 0,
            successRates: createMetricsObject("success_rate", transcoderId, metrics),
            roundTripScores: createMetricsObject("round_trip_score", transcoderId, metrics),
            scores: createMetricsObject("score", transcoderId, metrics),
          },
        }),
        {}
      );

      return res.status(200).json(combined);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
