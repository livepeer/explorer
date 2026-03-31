import {
  internalError,
  methodNotAllowed,
  validateInput,
  validateOutput,
} from "@lib/api/errors";
import {
  GenerateProofInputSchema,
  GenerateProofOutputSchema,
} from "@lib/api/schemas/generate-proof";
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
      const inputValidation = GenerateProofInputSchema.safeParse(_req.body);

      // Explicit check required for TypeScript type narrowing
      if (!inputValidation.success) {
        return validateInput(
          inputValidation,
          res,
          "account, delegate, stake, and fees are required"
        );
      }
      const { account, delegate, stake, fees } = inputValidation.data;

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

      const outputValidation = GenerateProofOutputSchema.safeParse(proof);
      if (validateOutput(outputValidation, res, "generateProof")) {
        return;
      }

      return res.status(200).json(proof);
    }

    return methodNotAllowed(res, method ?? "unknown", ["POST"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default generateProof;
