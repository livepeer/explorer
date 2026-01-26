import { getCacheControlHeader } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  validateOutput,
} from "@lib/api/errors";
import { EnsAddressSchema, EnsIdentitySchema } from "@lib/api/schemas";
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

      // Validate input: address query parameter
      if (!address || Array.isArray(address)) {
        return badRequest(
          res,
          "Address query parameter is required and must be a single value"
        );
      }

      const addressResult = EnsAddressSchema.safeParse(address);
      if (!addressResult.success) {
        return badRequest(
          res,
          "Invalid address format",
          addressResult.error.issues.map((e) => e.message).join(", ")
        );
      }

      const validatedAddress = addressResult.data;

      const ens = await getEnsForAddress(validatedAddress as Address);

      // Validate output: ENS identity response
      const outputResult = EnsIdentitySchema.safeParse(ens);
      const validationError = validateOutput(outputResult, res, "api/ens-data");
      if (validationError) return validationError;

      return res.status(200).json(ens);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
