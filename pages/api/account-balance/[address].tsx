import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { getBondingManager, getLivepeerToken } from "@lib/api/contracts";
import { AccountBalance } from "@lib/api/types/get-account-balance";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AccountBalance | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("hour"));

      const { address } = req.query;

      if (isValidAddress(address)) {
        const livepeerToken = await getLivepeerToken();
        const bondingManager = await getBondingManager();

        const balance = await livepeerToken.balanceOf(address);
        const allowance = await livepeerToken.allowance(
          address,
          bondingManager.address
        );

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
