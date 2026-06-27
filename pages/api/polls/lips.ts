import { getCacheControlHeader } from "@lib/api";
import { externalApiError, methodNotAllowed } from "@lib/api/errors";
import { getPollLips } from "@lib/api/poll-lips";
import { PollLips } from "@lib/api/types/get-poll-lips";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PollLips | null>
) => {
  const method = req.method;

  if (method !== "GET") {
    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  }

  try {
    res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

    const lips = await getPollLips();
    return res.status(200).json(lips);
  } catch (err) {
    return externalApiError(
      res,
      "poll LIPs",
      err instanceof Error ? err.message : undefined
    );
  }
};

export default handler;
