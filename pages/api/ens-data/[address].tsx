import { getCacheControlHeader } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import { badRequest, internalError, methodNotAllowed } from "@lib/api/errors";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { NextApiRequest, NextApiResponse } from "next";
import { Address, isAddress } from "viem";

const blacklist = ["0xcb69ffc06d3c218472c50ee25f5a1d3ca9650c44"].map((a) =>
  a.toLowerCase()
);

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader("week"));

      if (
        !!address &&
        !Array.isArray(address) &&
        isAddress(address) &&
        !blacklist.includes(address.toLowerCase())
      ) {
        const ens = await getEnsForAddress(address as Address);

        return res.status(200).json(ens);
      } else {
        return badRequest(res, "Invalid address format");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
