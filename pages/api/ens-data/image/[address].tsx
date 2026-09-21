import { getCacheControlHeader } from "@lib/api";
import {
  ENS_BLACKLISTED_ADDRESSES,
  ENS_CACHE_TTL,
  getAvatarUrlCached,
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

          if (!identity.name) {
            return notFound(res, "No ENS name for this address");
          }

          const imageUrl = await getAvatarUrlCached(address, identity.name);

          if (!imageUrl) {
            return notFound(res, "ENS avatar not found");
          }

          const response = await fetch(imageUrl);

          if (!response.ok) {
            return notFound(res, "ENS avatar not found");
          }

          const arrayBuffer = await response.arrayBuffer();

          res.setHeader("Cache-Control", getCacheControlHeader(ENS_CACHE_TTL));

          return res.end(Buffer.from(arrayBuffer));
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
