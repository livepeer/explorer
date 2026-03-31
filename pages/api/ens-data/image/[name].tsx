import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { getCacheControlHeader } from "@lib/api";
import {
  internalError,
  methodNotAllowed,
  notFound,
  validateInput,
} from "@lib/api/errors";
import { EnsAvatarResultSchema, EnsNameSchema } from "@lib/api/schemas";
import { l1PublicClient } from "@lib/chains";
import { parseArweaveTxId, parseCid } from "livepeer/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { normalize } from "viem/ens";

const stripIpv6Brackets = (value: string) => value.replace(/^\[|\]$/g, "");

const isPrivateOrLocalIp = (address: string) => {
  const normalized = stripIpv6Brackets(address).toLowerCase();

  if (normalized.startsWith("::ffff:")) {
    return isPrivateOrLocalIp(normalized.slice(7));
  }

  const ipVersion = isIP(normalized);

  if (!ipVersion) {
    return false;
  }

  if (ipVersion === 4) {
    const [a, b] = normalized.split(".").map(Number);

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fec0:")
  );
};

const getSafeAvatarUrl = async (value: string) => {
  try {
    const parsedUrl = new URL(value);

    if (parsedUrl.protocol !== "https:") {
      return null;
    }

    const hostname = stripIpv6Brackets(parsedUrl.hostname).toLowerCase();

    if (
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost")
    ) {
      return null;
    }

    if (isPrivateOrLocalIp(hostname)) {
      return null;
    }

    if (isIP(hostname)) {
      return parsedUrl.toString();
    }

    const resolvedAddresses = await lookup(hostname, {
      all: true,
      verbatim: true,
    });

    if (
      resolvedAddresses.length === 0 ||
      resolvedAddresses.some(({ address }) => isPrivateOrLocalIp(address))
    ) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { name } = req.query;

      // EnsNameSchema handles undefined, arrays, and validates format + blacklist
      const nameResult = EnsNameSchema.safeParse(name);
      if (!nameResult.success) {
        return validateInput(nameResult, res, "Invalid ENS name");
      }

      const validatedName = nameResult.data;

      try {
        const rawAvatar = await l1PublicClient.getEnsAvatar({
          name: normalize(validatedName),
        });

        const avatarValidation = EnsAvatarResultSchema.safeParse(rawAvatar);

        if (!avatarValidation.success) {
          return internalError(
            res,
            new Error("Invalid avatar data from RPC provider")
          );
        }

        const avatar = avatarValidation.data;

        const cid = parseCid(avatar);
        const arweaveId = parseArweaveTxId(avatar);

        const imageUrl = cid?.id
          ? `https://dweb.link/ipfs/${cid.id}`
          : arweaveId?.id
          ? arweaveId.url
          : avatar?.startsWith("https://")
          ? avatar
          : `https://metadata.ens.domains/mainnet/avatar/${validatedName}`;

        // Restrict avatar fetches to public https URLs and block redirects.
        const safeImageUrl = await getSafeAvatarUrl(imageUrl);

        if (!safeImageUrl) {
          return notFound(res, "Invalid or unsupported ENS avatar URL");
        }

        const response = await fetch(safeImageUrl, { redirect: "error" });

        if (!response.ok) {
          return notFound(res, "ENS avatar not found");
        }

        const arrayBuffer = await response.arrayBuffer();

        res.setHeader("Cache-Control", getCacheControlHeader("week"));

        return res.end(Buffer.from(arrayBuffer));
      } catch (e) {
        console.error(e);
        return notFound(res, "ENS avatar not found");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
