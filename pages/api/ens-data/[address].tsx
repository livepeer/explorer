import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { NextApiRequest, NextApiResponse } from "next";
import { Address } from "viem";

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
        isValidAddress(address) &&
        !blacklist.includes(address.toLowerCase())
      ) {
        const ens = await getEnsForAddress(address as Address);

        return res.status(200).json(ens);
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
