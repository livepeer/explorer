import { getCacheControlHeader } from "@lib/api";
import {
  internalError,
  methodNotAllowed,
  notFound,
  validateInput,
} from "@lib/api/errors";
import { EnsAvatarResultSchema, EnsNameSchema } from "@lib/api/schemas";
import { WebUrlSchema } from "@lib/api/schemas/common";
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

      // EnsNameSchema handles undefined, arrays, and validates format + blacklist
      const nameResult = EnsNameSchema.safeParse(name);
      const inputValidationError = validateInput(
        nameResult,
        res,
        "Invalid ENS name"
      );
      if (inputValidationError) return inputValidationError;

      if (!nameResult.success) {
        return internalError(res, new Error("ENS name validation failed"));
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

        // Extra validation to prevent SSRF - Server Side Request Forgery
        const urlValidation = WebUrlSchema.safeParse(imageUrl);

        if (!urlValidation.success) {
          return notFound(res, "Invalid or missing ENS avatar URL");
        }

        const response = await fetch(urlValidation.data);

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
