import { getCacheControlHeader } from "@lib/api/api";
import {
  internalError,
  methodNotAllowed,
  notFound,
  validateInput,
} from "@lib/api/errors";
import { EnsNameSchema } from "@lib/api/schemas/ens";
import { NextApiRequest, NextApiResponse } from "next";
import { normalize } from "viem/ens";

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

      const nameResult = EnsNameSchema.safeParse(name);
      if (nameResult.success) {
        try {
          const normalizedName = normalize(nameResult.data);
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
        return validateInput(nameResult, res, "Invalid ENS name");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
