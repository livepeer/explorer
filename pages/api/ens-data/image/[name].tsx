import { getCacheControlHeader } from "@lib/api/api";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  notFound,
} from "@lib/api/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { normalize } from "viem/ens";

const blacklist = ["salty-minning.eth"];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TIMEOUT_MS = 10_000;

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
          const normalizedName = normalize(name);
          // getEnsAvatar fetches owner-set URLs before returning them.
          const avatarUrl = new URL(
            `/mainnet/avatar/${encodeURIComponent(normalizedName)}`,
            "https://metadata.ens.domains"
          );
          const response = await fetch(avatarUrl, {
            redirect: "error",
            signal: AbortSignal.timeout(AVATAR_TIMEOUT_MS),
          });

          const contentType = response.headers
            .get("content-type")
            ?.split(";")[0]
            .trim()
            .toLowerCase();
          const contentLength = Number(response.headers.get("content-length"));
          if (
            !response.ok ||
            !contentType?.startsWith("image/") ||
            contentLength > MAX_AVATAR_BYTES ||
            !response.body
          ) {
            return notFound(res, "ENS avatar not found");
          }

          const reader = response.body.getReader();
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              totalBytes += value.byteLength;
              if (totalBytes > MAX_AVATAR_BYTES) {
                await reader.cancel();
                return notFound(res, "ENS avatar not found");
              }
              chunks.push(Buffer.from(value));
            }
          } finally {
            reader.releaseLock();
          }

          res.setHeader("Content-Type", contentType);
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; sandbox"
          );
          res.setHeader("Cache-Control", getCacheControlHeader("week"));

          return res.end(Buffer.concat(chunks, totalBytes));
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
