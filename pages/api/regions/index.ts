import { getCacheControlHeader } from "@lib/api";
import { NextApiRequest, NextApiResponse } from "next";
import { Regions, Region } from "@lib/api/types/get-regions";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<Regions | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      const metricsUrl = process.env.NEXT_PUBLIC_METRICS_SERVER_URL;
      const aiMetricsUrl = process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL;

      const fetchRegions = async (url: string | undefined): Promise<Regions | null> => {
        if (!url) return null;
        const response = await fetch(`${url}/api/regions`);
        return response.ok ? response.json() : null;
      };

      // Fetch regions in parallel
      const [metricsRegions, aiMetricsRegions] = await Promise.all([
        fetchRegions(metricsUrl),
        fetchRegions(aiMetricsUrl),
      ]);

      // Merge regions from both sources and keep only unique regions
      const mergedRegions: Regions = {
        regions: Array.from(
          new Map(
            [
              ...(metricsRegions?.regions || []),
              ...(aiMetricsRegions?.regions || []),
            ].map((region) => [
              `${region.id}-${region.name}-${region.type}`,
              region
            ])
          ).values()
        ),
      };

      // Sort by region name with "Global" appearing at the top
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