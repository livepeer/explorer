import { getCacheControlHeader } from "@lib/api";
import {
  badRequest,
  externalApiError,
  internalError,
  methodNotAllowed,
} from "@lib/api/errors";
import {
  PerformanceMetrics,
  RegionalValues,
  Score,
} from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { avg } from "@lib/utils";
import { checkAddressEquality } from "@utils/web3";
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

/**
 * Fetch and parse JSON from a given URL.
 * @returns The parsed JSON, or null if the fetch fails. Never rejects, so one
 * failed upstream cannot reject a Promise.all.
 */
const fetchJson = async <T,>(url: string): Promise<T | null> => {
  try {
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      console.error(
        `Fetch error: ${url}`,
        response.status,
        (await response.text()).slice(0, 500)
      );
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(
      `Fetch error: ${url}`,
      err instanceof Error ? err.message : err
    );
    return null;
  }
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address } = req.query;

      if (!!address && !Array.isArray(address) && isAddress(address)) {
        const transcoderId = address.toLowerCase();

        const topScoreUrl = `${process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL}/api/top_ai_score?orchestrator=${transcoderId}`;
        const metricsUrl = `${process.env.NEXT_PUBLIC_METRICS_SERVER_URL}/api/aggregated_stats?orchestrator=${transcoderId}`;
        const pricingUrl = `${CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl}?excludeUnavailable=False`;

        const [topAIScore, metrics, transcodersWithPrice] = await Promise.all([
          fetchJson<Score>(topScoreUrl),
          fetchJson<MetricsResponse>(metricsUrl),
          fetchJson<PriceResponse>(pricingUrl),
        ]);

        // Every upstream being down is never a legitimate empty state, so fail
        // loudly rather than rendering a healthy-looking orchestrator with no data.
        if (!topAIScore && !metrics && !transcodersWithPrice) {
          return externalApiError(res, "all metrics servers");
        }

        // Expire quickly so upstream recovery is not hidden for an hour.
        const degraded = !topAIScore || !metrics || !transcodersWithPrice;
        res.setHeader(
          "Cache-Control",
          getCacheControlHeader(degraded ? "minute" : "hour")
        );

        const transcoderWithPrice = transcodersWithPrice?.find((t) =>
          checkAddressEquality(t.Address, transcoderId)
        );

        const uniqueRegions = (() => {
          const keys = new Set<string>();
          Object.values(metrics ?? {}).forEach((metric) => {
            if (metric) {
              Object.keys(metric).forEach((key) => keys.add(key));
            }
          });
          return Array.from(keys);
        })();

        const createMetricsObject = (
          metricKey: keyof Metric,
          transcoderId: string,
          metrics: MetricsResponse | null
        ): RegionalValues | null => {
          if (!metrics) return null;

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
          pricePerPixel: transcodersWithPrice
            ? transcoderWithPrice?.PricePerPixel ?? 0
            : null,
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
        return badRequest(res, "Invalid address format");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
