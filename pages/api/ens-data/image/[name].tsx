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
