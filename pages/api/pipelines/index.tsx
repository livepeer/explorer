import { getCacheControlHeader } from "@lib/api";
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
      const url = `${process.env.NEXT_PUBLIC_AI_METRICS_SERVER_URL}/api/pipelines${region ? `?region=${region}` : ""}`;
      const pipelinesResponse = await fetchWithRetry(url)
        .then((res) => res.json())
        .catch(() => {
          return { pipelines: [] };
        });
      const availablePipelines: AvailablePipelines = await pipelinesResponse;
      return res.status(200).json(availablePipelines);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (e) {
    console.error(e);
    return res.status(500).json(null);
  }
}

export default handler;
