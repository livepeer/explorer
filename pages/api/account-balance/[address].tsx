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
  validateOutput,
} from "@lib/api/errors";
import { AccountBalanceSchema, AddressSchema } from "@lib/api/schemas";
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

      const { address } = req.query;

      // AddressSchema handles undefined, arrays, and validates format
      const addressResult = AddressSchema.safeParse(address);
      const inputValidationError = validateInput(
        addressResult,
        res,
        "Invalid address format"
      );
      if (inputValidationError) return inputValidationError;

      const validatedAddress = addressResult.data;

      const livepeerTokenAddress = await getLivepeerTokenAddress();
      const bondingManagerAddress = await getBondingManagerAddress();

      const balance = await l2PublicClient.readContract({
        address: livepeerTokenAddress,
        abi: livepeerToken,
        functionName: "balanceOf",
        args: [validatedAddress as Address],
      });

      const allowance = await l2PublicClient.readContract({
        address: livepeerTokenAddress,
        abi: livepeerToken,
        functionName: "allowance",
        args: [validatedAddress as Address, bondingManagerAddress as Address],
      });

      const accountBalance: AccountBalance = {
        balance: balance.toString(),
        allowance: allowance.toString(),
      };

      // Validate output: account balance response
      const outputResult = AccountBalanceSchema.safeParse(accountBalance);
      const outputValidationError = validateOutput(
        outputResult,
        res,
        "api/account-balance"
      );
      if (outputValidationError) return outputValidationError;

      return res.status(200).json(accountBalance);
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
