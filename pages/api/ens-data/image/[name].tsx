import { getCacheControlHeader } from "@lib/api";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  notFound,
} from "@lib/api/errors";
import { optimizeImage } from "@lib/api/image-optimization";
import { l1PublicClient } from "@lib/chains";
import { parseArweaveTxId, parseCid } from "livepeer/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { normalize } from "viem/ens";

const blacklist = ["salty-minning.eth"];

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { name } = req.query;

      if (
        name &&
        typeof name === "string" &&
        name.length > 0 &&
        !blacklist.includes(name)
      ) {
        try {
          const avatar = await l1PublicClient.getEnsAvatar({
            name: normalize(name),
          });

          const cid = parseCid(avatar);
          const arweaveId = parseArweaveTxId(avatar);

          const imageUrl = cid?.id
            ? `https://dweb.link/ipfs/${cid.id}`
            : arweaveId?.id
            ? arweaveId.url
            : avatar?.startsWith("https://")
            ? avatar
            : `https://metadata.ens.domains/mainnet/avatar/${name}`;

          const response = await fetch(imageUrl);

          const arrayBuffer = await response.arrayBuffer();

          // Optimize image using utility
          const optimizationResult = await optimizeImage(arrayBuffer, {
            width: 96,
            height: 96,
            quality: 75,
            effort: 6,
          });

          // Set appropriate content type (fallback to original if optimization failed)
          if (optimizationResult.contentType === "image/jpeg") {
            const originalContentType =
              response.headers.get("content-type") || "image/jpeg";
            res.setHeader("Content-Type", originalContentType);
          } else {
            res.setHeader("Content-Type", optimizationResult.contentType);
          }

          res.setHeader(
            "Content-Length",
            optimizationResult.buffer.length.toString()
          );
          res.setHeader("Cache-Control", getCacheControlHeader("week"));

          return res.end(optimizationResult.buffer);
        } catch (e) {
          console.error(e);
          return notFound(res, "ENS avatar not found");
        }
      } else {
        return badRequest(res, "Invalid ENS name");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
