import { getCacheControlHeader } from "@lib/api";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { name } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader("day"));

      if (name && typeof name === "string" && name.length > 0) {
        const imageUrl = `https://metadata.ens.domains/mainnet/avatar/${name}`;

        const response = await fetch(imageUrl);
        if (response.headers.get("content-type").includes("application/json")) {
          return null;
        }

        const imageBlob = await response.blob();

        const buffer = await imageBlob.stream();

        return buffer.pipe(res);
      } else {
        return res.status(500).end("Invalid name");
      }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
