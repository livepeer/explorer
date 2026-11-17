import { getCacheControlHeader } from "@lib/api";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import {
  getBondingManagerAddress,
  getLivepeerTokenAddress,
} from "@lib/api/contracts";
import {
  internalError,
  methodNotAllowed,
  validateInput,
} from "@lib/api/errors";
import { AddressSchema } from "@lib/api/schemas";
import { AccountBalance } from "@lib/api/types/get-account-balance";
import { l2PublicClient } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AccountBalance | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("revalidate"));

      const addressResult = AddressSchema.safeParse(req.query.address);
      if (!addressResult.success) {
        return validateInput(addressResult, res, "Invalid address format");
      }
      const address = addressResult.data;

      const livepeerTokenAddress = await getLivepeerTokenAddress();
      const bondingManagerAddress = await getBondingManagerAddress();

      const balance = await l2PublicClient.readContract({
        address: livepeerTokenAddress,
        abi: livepeerToken,
        functionName: "balanceOf",
        args: [address as Address],
      });

      const allowance = await l2PublicClient.readContract({
        address: livepeerTokenAddress,
        abi: livepeerToken,
        functionName: "allowance",
        args: [address as Address, bondingManagerAddress as Address],
      });

      const accountBalance: AccountBalance = {
        balance: balance.toString(),
        allowance: allowance.toString(),
      };

      return res.status(200).json(accountBalance);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
