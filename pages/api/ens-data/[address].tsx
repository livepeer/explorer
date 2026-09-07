import { getCacheControlHeader } from "@lib/api";
import {
  ENS_BLACKLISTED_ADDRESSES,
  ENS_CACHE_TTL,
  getEnsForAddressCached,
  LockBusyError,
} from "@lib/api/ens";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  serviceBusy,
} from "@lib/api/errors";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { NextApiRequest, NextApiResponse } from "next";
import { Address, isAddress } from "viem";

const blacklist = ENS_BLACKLISTED_ADDRESSES;

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader(ENS_CACHE_TTL));

      if (
        !!address &&
        !Array.isArray(address) &&
        isAddress(address) &&
        !blacklist.includes(address.toLowerCase())
      ) {
        const ens = await getEnsForAddressCached(address as Address);

        return res.status(200).json(ens);
      } else {
        return badRequest(res, "Invalid address format");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    if (err instanceof LockBusyError) return serviceBusy(res, err.message);
    return internalError(res, err);
  }
};

export default handler;
