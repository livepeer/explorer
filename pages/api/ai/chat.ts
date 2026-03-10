import { stepCountIs, streamText } from "ai";
import type { NextApiRequest, NextApiResponse } from "next";

import { getCachedResponse, setCachedResponse } from "../../../lib/ai/cache";
import { model, systemPrompt } from "../../../lib/ai/config";
import { checkRateLimit } from "../../../lib/ai/ratelimit";
import {
  getAIUsageTool,
  getCurrentRoundTool,
  getDelegatorTool,
  getEventsTool,
  getOrchestratorsTool,
  getOrchestratorTool,
  getPerformanceTool,
  getProtocolStatsTool,
  getTreasuryTool,
} from "../../../lib/ai/tools";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    "unknown";

  const { allowed, remaining } = await checkRateLimit(ip);
  if (!allowed) {
    return res.status(429).json({
      error:
        "You've sent too many messages. Please wait a moment before trying again.",
      remaining,
    });
  }

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Extract latest user query for caching
  const lastUserMessage = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");

  let userQuery = "";
  if (lastUserMessage) {
    if (typeof lastUserMessage.content === "string") {
      userQuery = lastUserMessage.content;
    } else if (Array.isArray(lastUserMessage.parts)) {
      userQuery = lastUserMessage.parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join(" ");
    }
  }

  // Check semantic cache
  if (userQuery) {
    const cached = await getCachedResponse(userQuery);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.write(cached);
      return res.end();
    }
  }

  res.setHeader("X-Cache", "MISS");

  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    tools: {
      getOrchestrators: getOrchestratorsTool,
      getOrchestrator: getOrchestratorTool,
      getDelegator: getDelegatorTool,
      getProtocolStats: getProtocolStatsTool,
      getCurrentRound: getCurrentRoundTool,
      getPerformance: getPerformanceTool,
      getAIUsage: getAIUsageTool,
      getEvents: getEventsTool,
      getTreasury: getTreasuryTool,
    },
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      if (userQuery && text) {
        await setCachedResponse(userQuery, text);
      }
    },
  });

  result.pipeUIMessageStreamToResponse(res);
}
