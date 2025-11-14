import { getCacheControlHeader } from "@lib/api";
import { Region,Regions } from "@lib/api/types/get-regions";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";

const METRICS_URL = [
  process.env.NEXT_PUBLIC_METRICS_SERVER_URL,
  process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL,
];

/**
 * Fetch regions from a given URL.
 * @param url - The URL to fetch regions from.
 * @returns Returns a promise that resolves to the regions or null if the fetch fails.
 */
const fetchRegions = async (
  url: string | undefined
): Promise<Regions | null> => {
  if (!url) return null;
  const response = await fetchWithRetry(`${url}/api/regions`);
  return response.ok ? response.json() : null;
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
      const mergedRegions: Regions = {
        regions: Array.from(
          new Map(
            regionsData
              .flatMap((data) => data?.regions || [])
              .map((region) => [`${region.id}-${region.name}-${region.type}`, region])
          ).values()
        ),
      };

      const globalKey = "Global";
      mergedRegions.regions.sort((a: Region, b: Region) => {
        if (a.name.startsWith(globalKey) && !b.name.startsWith(globalKey)) {
          return -1;
        } else if (!a.name.startsWith(globalKey) && b.name.startsWith(globalKey)) {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      });

      return res.status(200).json(mergedRegions);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
