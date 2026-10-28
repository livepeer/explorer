import { getCacheControlHeader } from "@lib/api/api";
import {
  ENS_BLACKLISTED_ADDRESSES,
  ENS_CACHE_TTL,
  getEnsForAddressCached,
  LockBusyError,
} from "@lib/api/ens";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  notFound,
} from "@lib/api/errors";
import { l1PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { Address, isAddress } from "viem";
import { normalize } from "viem/ens";

const blacklist = ENS_BLACKLISTED_ADDRESSES;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TIMEOUT_MS = 10_000;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address: rawParam } = req.query;

      if (!rawParam || Array.isArray(rawParam)) {
        return badRequest(res, "Invalid address format");
      }

      let address: string;

      if (isAddress(rawParam)) {
        address = rawParam;
      } else {
        try {
          const resolved = await l1PublicClient.getEnsAddress({
            name: normalize(rawParam),
          });
          if (!resolved)
            return notFound(res, "No address found for this ENS name");
          address = resolved;
        } catch {
          return badRequest(res, "Invalid address format");
        }
      }

      if (
        !!address &&
        !Array.isArray(address) &&
        isAddress(address) &&
        !blacklist.includes(address.toLowerCase())
      ) {
        try {
          const identity = await getEnsForAddressCached(address as Address);

          if (!identity.name || !identity.avatar) {
            return notFound(res, "ENS avatar not found");
          }

          // Fetch only from the ENS metadata service, never owner-set URLs.
          const avatarUrl = new URL(
            `/mainnet/avatar/${encodeURIComponent(normalize(identity.name))}`,
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
          res.setHeader("Cache-Control", getCacheControlHeader(ENS_CACHE_TTL));

          return res.end(Buffer.concat(chunks, totalBytes));
        } catch (e) {
          if (e instanceof LockBusyError) {
            console.warn(
              "Avatar route: cache-lock busy, address in-flight:",
              address
            );
          } else {
            console.error(
              "Avatar fetch error:",
              e instanceof Error ? e.message : e,
              e instanceof Error ? e.stack : ""
            );
          }
          return notFound(res, "ENS avatar not found");
        }
      } else {
        return badRequest(res, "Invalid address format");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
