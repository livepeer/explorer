import { getCacheControlHeader } from "@lib/api";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  notFound,
} from "@lib/api/errors";
import { EnsNameSchema } from "@lib/api/schemas";
import { l1PublicClient } from "@lib/chains";
import { parseArweaveTxId, parseCid } from "livepeer/utils";
import { NextApiRequest, NextApiResponse } from "next";
import { normalize } from "viem/ens";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { name } = req.query;

      // Validate input: ENS name query parameter
      if (!name || Array.isArray(name)) {
        return badRequest(
          res,
          "ENS name query parameter is required and must be a single value"
        );
      }

      const nameResult = EnsNameSchema.safeParse(name);
      if (!nameResult.success) {
        return badRequest(
          res,
          "Invalid ENS name",
          nameResult.error.issues.map((e) => e.message).join(", ")
        );
      }

      const validatedName = nameResult.data;

      try {
        const avatar = await l1PublicClient.getEnsAvatar({
          name: normalize(validatedName),
        });

        const cid = parseCid(avatar);
        const arweaveId = parseArweaveTxId(avatar);

        const imageUrl = cid?.id
          ? `https://dweb.link/ipfs/${cid.id}`
          : arweaveId?.id
          ? arweaveId.url
          : avatar?.startsWith("https://")
          ? avatar
          : `https://metadata.ens.domains/mainnet/avatar/${validatedName}`;

        const response = await fetch(imageUrl);

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
