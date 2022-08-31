import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { getEnsForAddress } from "@lib/api/ens";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<EnsIdentity | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { address } = req.query;

      res.setHeader("Cache-Control", getCacheControlHeader("day"));

      if (isValidAddress(address)) {
        const ens = await getEnsForAddress(address);

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
