import { getCacheControlHeader } from "@lib/api";
import { NextApiRequest, NextApiResponse } from "next";

import { parseArweaveTxId, parseCid } from "livepeer/utils";
import { l1PublicClient } from "@lib/chains";
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
