import { tool } from "ai";
import { z } from "zod";

import { fetchWithRetry } from "../../fetchWithRetry";

export const getAIUsageTool = tool({
  description:
    "Get AI pipeline usage metrics and available AI models/pipelines on the Livepeer network. Use this when users ask about AI capabilities, which orchestrators support AI, or AI pipeline stats.",
  inputSchema: z.object({
    orchestrator: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional()
      .describe(
        "Optional orchestrator address to filter AI metrics for a specific orchestrator"
      ),
  }),
  execute: async ({ orchestrator }) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL ??
      "https://leaderboard-api.livepeer.cloud";

    // Fetch available pipelines
    const pipelinesResponse = await fetchWithRetry(
      `${baseUrl}/api/pipelines`
    )
      .then((res) => res.json())
      .catch(() => ({ pipelines: [] }));

    // Fetch aggregated stats for AI
    const statsResponse = await fetchWithRetry(
      `${baseUrl}/api/aggregated_stats`
    )
      .then((res) => res.json())
      .catch(() => ({}));

    const stats = statsResponse as Record<
      string,
      Record<string, Record<string, number>>
    >;
    const allOrchestrators = Object.keys(stats);

    if (orchestrator) {
      const orchStats = stats[orchestrator.toLowerCase()];
      if (!orchStats) {
        return {
          type: "error" as const,
          message: `No AI metrics found for orchestrator ${orchestrator}`,
        };
      }

      const regions = Object.keys(orchStats);
      return {
        type: "stats" as const,
        title: `AI Metrics for ${orchestrator}`,
        stats: {
          "Regions Active": regions.join(", "),
          ...Object.fromEntries(
            regions.map((r) => [
              `Score (${r})`,
              `${((orchStats[r]?.score ?? 0) * 100).toFixed(1)}%`,
            ])
          ),
        },
      };
    }

    const pipelines = pipelinesResponse?.pipelines ?? [];

    return {
      type: "stats" as const,
      title: "AI Network Overview",
      stats: {
        "Orchestrators with AI": allOrchestrators.length,
        "Available Pipelines": Array.isArray(pipelines)
          ? pipelines.length
          : 0,
        "Pipeline Names": Array.isArray(pipelines)
          ? pipelines.map((p: { pipeline?: string }) => p.pipeline ?? "unknown").join(", ") ||
            "None reported"
          : "Unknown",
      },
    };
  },
});
