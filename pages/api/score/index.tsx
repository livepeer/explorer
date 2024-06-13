import { getCacheControlHeader } from "@lib/api";
import {
  AllPerformanceMetrics,
  PerformanceMetrics,
} from "@lib/api/types/get-performance";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { MetricsResponse, PriceResponse, avg } from "./[address]";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AllPerformanceMetrics | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      const metricsResponse = await fetch(
        `https://leaderboard-serverless.vercel.app/api/aggregated_stats`
      );
      const metrics: MetricsResponse = await metricsResponse.json();

      const response = await fetch(CHAIN_INFO[DEFAULT_CHAIN_ID].pricingUrl);
      const transcodersWithPrice: PriceResponse = await response.json();

      const allTranscoderIds = Object.keys(metrics);

      const combined: AllPerformanceMetrics = allTranscoderIds.reduce(
        (prev, transcoderId) => ({
          ...prev,
          [transcoderId]: {
            pricePerPixel:
              transcodersWithPrice?.find(
                (t) => t.Address.toLowerCase() === transcoderId
              ) ?? 0,
            successRates: {
              global: avg(metrics[transcoderId], "success_rate") * 100,
              fra: (metrics[transcoderId]?.FRA?.success_rate ?? 0) * 100 || 0,
              mdw: (metrics[transcoderId]?.MDW?.success_rate ?? 0) * 100 || 0,
              sin: (metrics[transcoderId]?.SIN?.success_rate ?? 0) * 100 || 0,
              nyc: (metrics[transcoderId]?.NYC?.success_rate ?? 0) * 100 || 0,
              lax: (metrics[transcoderId]?.LAX?.success_rate ?? 0) * 100 || 0,
              lon: (metrics[transcoderId]?.LON?.success_rate ?? 0) * 100 || 0,
              prg: (metrics[transcoderId]?.PRG?.success_rate ?? 0) * 100 || 0,
              sao: (metrics[transcoderId]?.SAO?.success_rate ?? 0) * 100 || 0,
              atl: (metrics[transcoderId]?.ATL?.success_rate ?? 0) * 100 || 0,
              hnd: (metrics[transcoderId]?.HND?.success_rate ?? 0) * 100 || 0,
              mad: (metrics[transcoderId]?.MAD?.success_rate ?? 0) * 100 || 0,
              mia: (metrics[transcoderId]?.MIA?.success_rate ?? 0) * 100 || 0,
              mos2: (metrics[transcoderId]?.MOS2?.success_rate ?? 0) * 100 || 0,
              sto: (metrics[transcoderId]?.STO?.success_rate ?? 0) * 100 || 0,
              syd: (metrics[transcoderId]?.SYD?.success_rate ?? 0) * 100 || 0,
              sea: (metrics[transcoderId]?.SEA?.success_rate ?? 0) * 100 || 0,
            },
            roundTripScores: {
              global: avg(metrics[transcoderId], "round_trip_score") * 100,
              fra:
                (metrics[transcoderId]?.FRA?.round_trip_score ?? 0) * 100 || 0,
              mdw:
                (metrics[transcoderId]?.MDW?.round_trip_score ?? 0) * 100 || 0,
              sin:
                (metrics[transcoderId]?.SIN?.round_trip_score ?? 0) * 100 || 0,
              nyc:
                (metrics[transcoderId]?.NYC?.round_trip_score ?? 0) * 100 || 0,
              lax:
                (metrics[transcoderId]?.LAX?.round_trip_score ?? 0) * 100 || 0,
              lon:
                (metrics[transcoderId]?.LON?.round_trip_score ?? 0) * 100 || 0,
              prg:
                (metrics[transcoderId]?.PRG?.round_trip_score ?? 0) * 100 || 0,
              sao:
                (metrics[transcoderId]?.SAO?.round_trip_score ?? 0) * 100 || 0,
              atl:
                (metrics[transcoderId]?.ATL?.round_trip_score ?? 0) * 100 || 0,
              hnd:
                (metrics[transcoderId]?.HND?.round_trip_score ?? 0) * 100 || 0,
              mad:
                (metrics[transcoderId]?.MAD?.round_trip_score ?? 0) * 100 || 0,
              mia:
                (metrics[transcoderId]?.MIA?.round_trip_score ?? 0) * 100 || 0,
              mos2:
                (metrics[transcoderId]?.MOS2?.round_trip_score ?? 0) * 100 || 0,
              sto:
                (metrics[transcoderId]?.STO?.round_trip_score ?? 0) * 100 || 0,
              syd:
                (metrics[transcoderId]?.SYD?.round_trip_score ?? 0) * 100 || 0,
              sea:
                (metrics[transcoderId]?.SEA?.round_trip_score ?? 0) * 100 || 0,
            },
            scores: {
              global: avg(metrics[transcoderId], "score") * 100 || 0,
              fra: (metrics[transcoderId]?.FRA?.score ?? 0) * 100 || 0,
              mdw: (metrics[transcoderId]?.MDW?.score ?? 0) * 100 || 0,
              sin: (metrics[transcoderId]?.SIN?.score ?? 0) * 100 || 0,
              nyc: (metrics[transcoderId]?.NYC?.score ?? 0) * 100 || 0,
              lax: (metrics[transcoderId]?.LAX?.score ?? 0) * 100 || 0,
              lon: (metrics[transcoderId]?.LON?.score ?? 0) * 100 || 0,
              prg: (metrics[transcoderId]?.PRG?.score ?? 0) * 100 || 0,
              sao: (metrics[transcoderId]?.SAO?.score ?? 0) * 100 || 0,
              atl: (metrics[transcoderId]?.ATL?.score ?? 0) * 100 || 0,
              hnd: (metrics[transcoderId]?.HND?.score ?? 0) * 100 || 0,
              mad: (metrics[transcoderId]?.MAD?.score ?? 0) * 100 || 0,
              mia: (metrics[transcoderId]?.MIA?.score ?? 0) * 100 || 0,
              mos2: (metrics[transcoderId]?.MOS2?.score ?? 0) * 100 || 0,
              sto: (metrics[transcoderId]?.STO?.score ?? 0) * 100 || 0,
              syd: (metrics[transcoderId]?.SYD?.score ?? 0) * 100 || 0,
              sea: (metrics[transcoderId]?.SEA?.score ?? 0) * 100 || 0,
            },
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
