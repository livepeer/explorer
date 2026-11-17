import {
  externalApiError,
  internalError,
  methodNotAllowed,
  validateInput,
} from "@lib/api/errors";
import {
  PinataPinResponseSchema,
  UploadIpfsInputSchema,
} from "@lib/api/schemas";
import { AddIpfs } from "@lib/api/types/add-ipfs";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AddIpfs | null>
) => {
  try {
    const method = req.method;

    if (method === "POST") {
      const inputValidation = UploadIpfsInputSchema.safeParse(req.body);

      if (!inputValidation.success) {
        return validateInput(inputValidation, res, "Invalid JSON body");
      }

      const fetchResult = await fetch(
        `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
          body: JSON.stringify(inputValidation.data),
        }
      );

      if (!fetchResult.ok) {
        return externalApiError(res, "Pinata IPFS");
      }

      const result = await fetchResult.json();

      const pinataValidation = PinataPinResponseSchema.safeParse(result);

      if (!pinataValidation.success) {
        return externalApiError(
          res,
          "Pinata IPFS",
          "Invalid response from Pinata"
        );
      }

      return res.status(200).json({ hash: pinataValidation.data.IpfsHash });
    }

    return methodNotAllowed(res, method ?? "unknown", ["POST"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
