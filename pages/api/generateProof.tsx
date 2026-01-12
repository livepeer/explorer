import { badRequest, internalError, methodNotAllowed } from "@lib/api/errors";
import { DEFAULT_CHAIN_ID } from "@lib/chains";
import { EarningsTree } from "@lib/earningsTree";
import { utils } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { arbitrum } from "viem/chains";

import delegatorClaimSnapshot from "../../data/delegatorClaimSnapshot.json";
import delegatorClaimSnapshotRinkeby from "../../data/delegatorClaimSnapshotRinkeby.json";

const generateProof = async (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    const method = _req.method;

    if (method === "POST") {
      const { account, delegate, stake, fees } = _req.body;

      if (!account || !delegate || stake === undefined || fees === undefined) {
        return badRequest(
          res,
          "Missing required parameters",
          "account, delegate, stake, and fees are required"
        );
      }

      // generate the merkle tree from JSON
      const tree = EarningsTree.fromJSON(
        DEFAULT_CHAIN_ID === arbitrum.id
          ? JSON.stringify(delegatorClaimSnapshot)
          : JSON.stringify(delegatorClaimSnapshotRinkeby)
      );

      // generate the proof
      const leaf = utils.solidityPack(
        ["address", "address", "uint256", "uint256"],
        [account, delegate, stake, fees]
      );

      const proof = tree.getHexProof(leaf);

      return res.status(200).json(proof);
    }

    return methodNotAllowed(res, method ?? "unknown", ["POST"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default generateProof;
