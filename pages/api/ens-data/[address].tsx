import { getCacheControlHeader } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import { badRequest, internalError, methodNotAllowed } from "@lib/api/errors";
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
      if (!outputResult.success) {
        console.error(
          "[api/ens-data] Output validation failed:",
          outputResult.error
        );
        // In production, we might still return the data, but log the error
        // In development, this helps catch API changes early
        if (process.env.NODE_ENV === "development") {
          return internalError(
            res,
            new Error(
              `Output validation failed: ${outputResult.error.issues
                .map((e) => e.message)
                .join(", ")}`
            )
          );
        }
      }

      return res.status(200).json(ens);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
