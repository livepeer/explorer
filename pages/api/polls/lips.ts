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
    const lips = await getPollLips();
    res.setHeader("Cache-Control", getCacheControlHeader("minute"));
    return res.status(200).json(lips);
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    return externalApiError(
      res,
      "poll LIPs",
      err instanceof Error ? err.message : undefined
    );
  }
};

export default handler;
