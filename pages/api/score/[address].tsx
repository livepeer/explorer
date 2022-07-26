import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { PerformanceMetrics } from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
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
        FRA: Metric;
        LAX: Metric;
        LON: Metric;
        MDW: Metric;
        NYC: Metric;
        PRG: Metric;
        SIN: Metric;
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

export function avg(obj, key) {
  if (!obj || !key) {
    return 0;
  }
  const arr = Object.values(obj);
  const sum = (prev, cur) => ({ [key]: prev[key] + cur[key] });
  return arr.reduce(sum)[key] / arr.length;
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

        const metricsResponse = await fetch(
          `https://leaderboard-serverless.vercel.app/api/aggregated_stats?orchestrator=${transcoderId}`
        );
        const metrics: MetricsResponse = await metricsResponse.json();

        const response = await fetch(
          `${CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl}?excludeUnavailable=False`
        );
        const transcodersWithPrice: PriceResponse = await response.json();
        const transcoderWithPrice = transcodersWithPrice.find((t) =>
          checkAddressEquality(t.Address, transcoderId)
        );

        const combined: PerformanceMetrics = {
          pricePerPixel: transcoderWithPrice?.PricePerPixel ?? 0,
          successRates: {
            global: avg(metrics[transcoderId], "success_rate") * 100,
            fra: metrics[transcoderId]?.FRA?.success_rate * 100 || 0,
            mdw: metrics[transcoderId]?.MDW?.success_rate * 100 || 0,
            sin: metrics[transcoderId]?.SIN?.success_rate * 100 || 0,
            nyc: metrics[transcoderId]?.NYC?.success_rate * 100 || 0,
            lax: metrics[transcoderId]?.LAX?.success_rate * 100 || 0,
            lon: metrics[transcoderId]?.LON?.success_rate * 100 || 0,
            prg: metrics[transcoderId]?.PRG?.success_rate * 100 || 0,
          },
          roundTripScores: {
            global: avg(metrics[transcoderId], "round_trip_score") * 100,
            fra: metrics[transcoderId]?.FRA?.round_trip_score * 100 || 0,
            mdw: metrics[transcoderId]?.MDW?.round_trip_score * 100 || 0,
            sin: metrics[transcoderId]?.SIN?.round_trip_score * 100 || 0,
            nyc: metrics[transcoderId]?.NYC?.round_trip_score * 100 || 0,
            lax: metrics[transcoderId]?.LAX?.round_trip_score * 100 || 0,
            lon: metrics[transcoderId]?.LON?.round_trip_score * 100 || 0,
            prg: metrics[transcoderId]?.PRG?.round_trip_score * 100 || 0,
          },
          scores: {
            global: avg(metrics[transcoderId], "score") * 100 || 0,
            fra: metrics[transcoderId]?.FRA?.score * 100 || 0,
            mdw: metrics[transcoderId]?.MDW?.score * 100 || 0,
            sin: metrics[transcoderId]?.SIN?.score * 100 || 0,
            nyc: metrics[transcoderId]?.NYC?.score * 100 || 0,
            lax: metrics[transcoderId]?.LAX?.score * 100 || 0,
            lon: metrics[transcoderId]?.LON?.score * 100 || 0,
            prg: metrics[transcoderId]?.PRG?.score * 100 || 0,
          },
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
