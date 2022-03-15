import type { NextApiRequest, NextApiResponse } from "next";
import delegatorClaimSnapshot from "../../data/delegatorClaimSnapshot.json";
import { EarningsTree } from "@lib/earningsTree";
import { utils } from "ethers";

const generateProof = async (_req: NextApiRequest, res: NextApiResponse) => {
  const { account, delegate, stake, fees } = _req.body;
  // generate the merkle tree from JSON
  const tree = EarningsTree.fromJSON(JSON.stringify(delegatorClaimSnapshot));

  // generate the proof
  const leaf = utils.solidityPack(
    ["address", "address", "uint256", "uint256"],
    [account, delegate, stake, fees]
  );

  const proof = tree.getHexProof(leaf);

  res.json(proof);
};

export default generateProof;
