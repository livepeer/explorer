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

      const regionsResponse = await fetch(       
        `${process.env.NEXT_PUBLIC_METRICS_SERVER_URL}/api/regions`
      );
      const regions: Regions = await regionsResponse.json();

      // sort by region name and make sure anything starting with "GLOBAL" appears at the top of the list 
      // while also being sorted alphabetically
      const globalKey = "Global";
      regions.regions.sort((a: Region, b: Region) => {
        if (a.name.startsWith(globalKey) && !b.name.startsWith(globalKey)) {
          return -1;
        } else if (!a.name.startsWith(globalKey) && b.name.startsWith(globalKey)) {
          return 1;
        } else {
          return a.name.localeCompare(b.name);
        }
      });

      return res.status(200).json(regions);
    }
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;