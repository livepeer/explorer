import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import {
  getBondingManagerAddress,
  getLivepeerTokenAddress,
} from "@lib/api/contracts";
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

      if (isValidAddress(address)) {
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
      } else {
        return res.status(500).end("Invalid ID");
      }
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
