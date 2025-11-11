import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { PerformanceMetrics, RegionalValues } from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { checkAddressEquality } from "@lib/utils";
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

type ScoreResponse = {
  value: number;
  region: string;
  model: string;
  pipeline: string;
  orchestrator: string;
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

export function avg(obj, key) {
  if (!obj || !key) {
    return 0;
  }
  const arr = Object.values(obj);
  const sum = (prev, cur) => ({ [key]: prev[key] + cur[key] });
  return (arr?.reduce(sum)?.[key] ?? 0) / arr.length;
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      if (isValidAddress(address)) {
        const transcoderId = address.toLowerCase();

        // Fetch the top AI score.
        const topScoreResponse = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL}/api/top_ai_score?orchestrator=${transcoderId}`
        );
        if (!topScoreResponse.ok) {
          return res.status(500).end("Failed to fetch top AI score");
        }
        const topAIScore: ScoreResponse = await topScoreResponse.json();

        // Fetch aggregated metrics.
        const metricsResponse = await fetchWithRetry(
          `${process.env.NEXT_PUBLIC_METRICS_SERVER_URL}/api/aggregated_stats?orchestrator=${transcoderId}`
        );
        if (!metricsResponse.ok) {
          return res.status(500).end("Failed to fetch metrics");
        }
        const metrics: MetricsResponse = await metricsResponse.json();

        // Fetch Transcoder price.
        const response = await fetchWithRetry(
          `${CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl}?excludeUnavailable=False`
        );
        if (!response.ok) {
          return res.status(500).end("Failed to fetch transcoders with price");
        }
        const transcodersWithPrice: PriceResponse = await response.json();
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
          metricKey: string,
          transcoderId: string,
          metrics: MetricsResponse
        ): RegionalValues => {
          const metricsObject: RegionalValues = uniqueRegions.reduce(
            (acc, metricsRegionKey) => {
              const val =
                metrics[transcoderId]?.[metricsRegionKey]?.[metricKey];
              if (val !== null && val !== "")
                acc[metricsRegionKey] =
                  (metrics[transcoderId]?.[metricsRegionKey]?.[metricKey] ??
                    0) * 100 || 0;
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
          topAIScore: topAIScore,
        };

        return res.status(200).json(combined);
      } else {
        return res.status(500).end("Invalid ID");
      }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
