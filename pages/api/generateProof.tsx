import type { NextApiRequest, NextApiResponse } from "next";
import { EarningsTree } from "@lib/earningsTree";
import { utils } from "ethers";
import { DEFAULT_CHAIN_ID } from "@lib/chains";
import { arbitrum } from "viem/chains";

import delegatorClaimSnapshotRinkeby from "../../data/delegatorClaimSnapshotRinkeby.json";
import delegatorClaimSnapshot from "../../data/delegatorClaimSnapshot.json";

const generateProof = async (_req: NextApiRequest, res: NextApiResponse) => {
  const { account, delegate, stake, fees } = _req.body;
  // generate the merkle tree from JSON
  const tree = EarningsTree.fromJSON(
    DEFAULT_CHAIN_ID === arbitrum.id
      ? JSON.stringify(delegatorClaimSnapshot)
      : JSON.stringify(delegatorClaimSnapshotRinkeby),
  );

  // generate the proof
  const leaf = utils.solidityPack(
    ["address", "address", "uint256", "uint256"],
    [account, delegate, stake, fees],
  );

  const proof = tree.getHexProof(leaf);

  res.json(proof);
};

export default generateProof;
