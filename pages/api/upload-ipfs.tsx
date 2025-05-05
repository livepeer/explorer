import { AddIpfs } from "@lib/api/types/add-ipfs";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AddIpfs | null>,
) => {
  try {
    const method = req.method;

    if (method === "POST") {
      const fetchResult = await fetch(
        `https://api.pinata.cloud/pinning/pinJSONToIPFS`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
          body: JSON.stringify(req.body),
        },
      );
      const result = await fetchResult.json();

      return res.status(200).json({ hash: result.IpfsHash });
    }

    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
