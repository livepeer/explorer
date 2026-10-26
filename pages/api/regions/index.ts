import { getCacheControlHeader } from "@lib/api";
import {
  internalError,
  methodNotAllowed,
  validateExternalResponse,
  validateOutput,
} from "@lib/api/errors";
import { RegionObjectSchema, RegionsSchema } from "@lib/api/schemas";
import { Region, Regions } from "@lib/api/types/get-regions";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";

const METRICS_URL = [
  process.env.NEXT_PUBLIC_METRICS_SERVER_URL,
  process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL,
];

/**
 * Fetch regions from a given URL.
 * @param url - The URL to fetch regions from.
 * @returns Returns a promise that resolves to the validated regions or null if the fetch fails.
 */
const fetchRegions = async (
  url: string | undefined
): Promise<Regions | null> => {
  if (!url) return null;
  const response = await fetchWithRetry(`${url}/api/regions`);
  if (!response.ok) return null;

  const responseData = await response.json();

  // Validate external API response: regions response structure
  const apiResult = RegionsSchema.safeParse(responseData);
  return validateExternalResponse(
    apiResult,
    "api/regions",
    `URL: ${url}/api/regions`
  );
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<Regions | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      const regionsData = await Promise.all(METRICS_URL.map(fetchRegions));

      // Validate and filter regions from external APIs
      const validatedRegions = regionsData
        .flatMap((data) => data?.regions || [])
        .filter((region) => {
          const regionResult = RegionObjectSchema.safeParse(region);
          if (!regionResult.success) {
            console.warn(
              "[api/regions] Invalid region from external API:",
              region,
              regionResult.error.issues.map((e) => e.message).join(", ")
            );
            return false;
          }
          return true;
        });

      const mergedRegions: Regions = {
        regions: Array.from(
          new Map(
            validatedRegions.map((region) => [
              `${region.id}-${region.name}-${region.type}`,
              region,
            ])
          ).values()
        ),
      };

      const globalKey = "Global";
      mergedRegions.regions.sort((a: Region, b: Region) => {
        if (a.name.startsWith(globalKey) && !b.name.startsWith(globalKey)) {
          return -1;
        } else if (
          !a.name.startsWith(globalKey) &&
          b.name.startsWith(globalKey)
        ) {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      });

      // Validate output: regions response
      const outputResult = RegionsSchema.safeParse(mergedRegions);
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/regions"
      );
      if (outputValidationError) return outputValidationError;

      return res.status(200).json(mergedRegions);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
