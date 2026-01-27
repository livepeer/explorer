import { getCacheControlHeader } from "@lib/api";
import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateInput,
} from "@lib/api/errors";
import { AvailablePipelinesSchema, RegionSchema } from "@lib/api/schemas";
import { AvailablePipelines } from "@lib/api/types/get-available-pipelines";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AvailablePipelines | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      const { region } = req.query;

      // RegionSchema.optional() handles undefined, arrays, and validates non-empty strings
      const regionResult = RegionSchema.optional().safeParse(region);
      const inputValidationError = validateInput(
        regionResult,
        res,
        "Invalid region format"
      );
      if (inputValidationError) return inputValidationError;

      const validatedRegion = regionResult.data;

      if (!process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL) {
        console.error("NEXT_PUBLIC_AI_METRICS_SERVER_URL is not set");
        return externalApiError(
          res,
          "AI metrics server",
          "NEXT_PUBLIC_AI_METRICS_SERVER_URL environment variable is not configured"
        );
      }

      const url = `${
        process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL
      }/api/pipelines${validatedRegion ? `?region=${validatedRegion}` : ""}`;

      let pipelinesResponse: AvailablePipelines;

      try {
        const response = await fetchWithRetry(url);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          console.error(
            "Pipelines fetch error:",
            response.status,
            errorText,
            `URL: ${url}`
          );
          return externalApiError(
            res,
            "AI metrics server",
            `Status ${response.status}: ${errorText}`
          );
        }

        const responseData = await response.json();

        // Validate external API response: pipelines response structure
        const apiResult = AvailablePipelinesSchema.safeParse(responseData);
        if (!apiResult.success) {
          console.error(
            "[api/pipelines] External API response validation failed:",
            apiResult.error
          );
          return externalApiError(
            res,
            "AI metrics server",
            "Invalid response structure from AI metrics server"
          );
        }

        pipelinesResponse = apiResult.data;
      } catch (err) {
        console.error("[api/pipelines] Fetch error:", err);
        // Fallback to empty pipelines on error (existing behavior)
        // This is a known-good value, so no validation needed
        pipelinesResponse = { pipelines: [] };
      }

      return res.status(200).json(pipelinesResponse);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
