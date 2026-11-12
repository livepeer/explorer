import { getCacheControlHeader } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import {
  internalError,
  methodNotAllowed,
  validateInput,
} from "@lib/api/errors";
import { EnsAddressSchema } from "@lib/api/schemas";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("week"));

      const { address } = req.query;

      // EnsAddressSchema handles undefined, arrays, and validates format + blacklist
      const addressResult = EnsAddressSchema.safeParse(address);
      const inputValidationError = validateInput(
        addressResult,
        res,
        "Invalid address format"
      );
      if (inputValidationError) return inputValidationError;

      const validatedAddress = addressResult.data;

      const ens = await getEnsForAddress(validatedAddress as Address);

      return res.status(200).json(ens);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
