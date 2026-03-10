import { tool } from "ai";
import { z } from "zod";

import { fetchWithRetry } from "../../fetchWithRetry";

export const getPerformanceTool = tool({
  description:
    "Get performance/leaderboard scores for orchestrators including success rates, round trip scores, and overall scores. Optionally filter by region. Use this when users ask about orchestrator performance, reliability, or the leaderboard.",
  inputSchema: z.object({
    region: z
      .string()
      .optional()
      .describe(
        "Optional region filter (e.g., 'FRA', 'LAX', 'NYC', 'LON', 'PRG', 'SAO', 'SIN'). Omit for global scores."
      ),
  }),
  execute: async ({ region }) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_METRICS_SERVER_URL ??
      "https://livepeer-leaderboard-serverless.vercel.app";

    const response = await fetchWithRetry(
      `${baseUrl}/api/aggregated_stats`
    ).then((res) => res.json());

    const metrics = response as Record<
      string,
      Record<string, Record<string, number>>
    >;
    const orchestratorIds = Object.keys(metrics);

    const rows = orchestratorIds
      .map((id) => {
        const regions = metrics[id];
        if (!regions) return null;

        if (region) {
          const r = regions[region];
          if (!r) return null;
          return {
            address: id,
            successRate: (r.success_rate ?? 0) * 100,
            roundTripScore: (r.round_trip_score ?? 0) * 100,
            score: (r.score ?? 0) * 100,
          };
        }

        // Global average
        const regionKeys = Object.keys(regions);
        if (regionKeys.length === 0) return null;

        const avgScore =
          regionKeys.reduce(
            (sum, rk) => sum + (regions[rk]?.score ?? 0),
            0
          ) / regionKeys.length;
        const avgSuccess =
          regionKeys.reduce(
            (sum, rk) => sum + (regions[rk]?.success_rate ?? 0),
            0
          ) / regionKeys.length;
        const avgRoundTrip =
          regionKeys.reduce(
            (sum, rk) => sum + (regions[rk]?.round_trip_score ?? 0),
            0
          ) / regionKeys.length;

        return {
          address: id,
          successRate: avgSuccess * 100,
          roundTripScore: avgRoundTrip * 100,
          score: avgScore * 100,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
      .slice(0, 20);

    return {
      type: "table" as const,
      title: `Orchestrator Performance${region ? ` (${region})` : " (Global)"}`,
      columns: ["Rank", "Address", "Score", "Success Rate", "Round Trip Score"],
      rows: rows.map((r, i) => [
        i + 1,
        r!.address,
        `${r!.score.toFixed(1)}%`,
        `${r!.successRate.toFixed(1)}%`,
        `${r!.roundTripScore.toFixed(1)}%`,
      ]),
    };
  },
});
