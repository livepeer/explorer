import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";
import type { NextApiRequest, NextApiResponse } from "next";

const totalTokenSupply = async (_req: NextApiRequest, res: NextApiResponse) => {
  const response = await fetch(
    `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorerAPI}?module=stats&action=tokensupply&contractaddress=0x58b6a8a3302369daec383334672404ee733ab239&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
  );
  const { result } = await response.json();
  res.end(result);
};

export default totalTokenSupply;
