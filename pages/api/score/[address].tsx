import { getCacheControlHeader } from "@lib/api";
import {
  PerformanceMetrics,
  RegionalValues,
} from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { avg, checkAddressEquality } from "@lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { isAddress } from "viem";

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

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      if (!!address && !Array.isArray(address) && isAddress(address)) {
        const transcoderId = address.toLowerCase();

        const topScoreUrl = `${process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL}/api/top_ai_score?orchestrator=${transcoderId}`;
        const metricsUrl = `${process.env.NEXT_PUBLIC_METRICS_SERVER_URL}/api/aggregated_stats?orchestrator=${transcoderId}`;
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
            errorText
          );
          return res.status(500).end("Failed to fetch top AI score");
        }

        if (!metricsResponse.ok) {
          const errorText = await metricsResponse.text();
          console.error(
            "Metrics fetch error:",
            metricsResponse.status,
            errorText
          );
          return res.status(500).end("Failed to fetch metrics");
        }

        if (!priceResponse.ok) {
          const errorText = await priceResponse.text();
          console.error(
            "Transcoder price fetch error:",
            priceResponse.status,
            errorText
          );
          return res.status(500).end("Failed to fetch transcoders with price");
        }

        const topAIScore: ScoreResponse = await topScoreResponse.json();
        const metrics: MetricsResponse = await metricsResponse.json();
        const transcodersWithPrice: PriceResponse = await priceResponse.json();

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
                acc[metricsRegionKey] = (value ?? 0) * 100 || 0;
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
