import {
  externalApiError,
  internalError,
  methodNotAllowed,
} from "@lib/api/errors";
import { AddIpfs } from "@lib/api/types/add-ipfs";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AddIpfs | null>
) => {
  try {
    const method = req.method;

    if (method === "POST") {
      const fetchResult = await fetch(
        `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
          body: JSON.stringify(req.body),
        }
      );

      if (!fetchResult.ok) {
        return externalApiError(res, "Pinata IPFS");
      }

      const result = await fetchResult.json();

      return res.status(200).json({ hash: result.IpfsHash });
    }

    return methodNotAllowed(res, method ?? "unknown", ["POST"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
