import type { NextApiRequest, NextApiResponse } from "next";

const totalTokenSupply = async (_req: NextApiRequest, res: NextApiResponse) => {
  return res.status(200).json({});
};

export default totalTokenSupply;
