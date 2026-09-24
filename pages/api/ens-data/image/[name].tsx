import { getCacheControlHeader } from "@lib/api";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  notFound,
} from "@lib/api/errors";
import { l1PublicClient } from "@lib/chains";
import { parseArweaveTxId, parseCid } from "livepeer/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { normalize } from "viem/ens";

const blacklist = ["salty-minning.eth"];

const ARWEAVE_TX_ID = /^[A-Za-z0-9_-]{43}$/;

/**
 * Map an owner-set avatar record to a fixed, trusted host, so the record
 * can't point this endpoint at an arbitrary server (SSRF).
 */
const resolveAvatarUrl = (avatar: string | null, name: string) => {
  const cid = parseCid(avatar);
  if (cid?.id) {
    return `https://dweb.link/ipfs/${cid.id}`;
  }

  const arweaveId = parseArweaveTxId(avatar)?.id;
  if (arweaveId && ARWEAVE_TX_ID.test(arweaveId)) {
    return `https://arweave.net/${arweaveId}`;
  }

  return `https://metadata.ens.domains/mainnet/avatar/${encodeURIComponent(
    name
  )}`;
};

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
          const avatar = await l1PublicClient.getEnsAvatar({
            name: normalizedName,
          });

          const response = await fetch(
            resolveAvatarUrl(avatar, normalizedName)
          );

          const arrayBuffer = await response.arrayBuffer();

          res.setHeader("Cache-Control", getCacheControlHeader("week"));

          return res.end(Buffer.from(arrayBuffer));
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
