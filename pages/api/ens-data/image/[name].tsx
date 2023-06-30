import { getCacheControlHeader } from "@lib/api";
import { NextApiRequest, NextApiResponse } from "next";

import { parseArweaveTxId, parseCid } from "livepeer/utils";
import { l1PublicClient } from "@lib/chains";
import { normalize } from "viem/ens";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { name } = req.query;

      if (name && typeof name === "string" && name.length > 0) {
        try {
          res.setHeader("Cache-Control", getCacheControlHeader("day"));

          const avatar = await l1PublicClient.getEnsAvatar({
            name: normalize(name),
          });

          const cid = parseCid(avatar);
          const arweaveId = parseArweaveTxId(avatar);

          const imageUrl = cid?.id
            ? `https://dweb.link/ipfs/${cid.id}`
            : arweaveId?.id
            ? arweaveId.url
            : avatar.startsWith("https://")
            ? avatar
            : `https://metadata.ens.domains/mainnet/avatar/${name}`;

          const response = await fetch(imageUrl);

          const imageBlob = await response.blob();

          const buffer = await imageBlob.stream();

          res.setHeader("Cache-Control", getCacheControlHeader("week"));

          return buffer.pipe(res);
        } catch (e) {
          return res.status(404).end("Invalid name");
        }
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
