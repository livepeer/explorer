import { getCacheControlHeader, isValidAddress } from "@lib/api";
import { getRoundsManager } from "@lib/api/contracts";
import { L1Delegator, UnbondingLock } from "@lib/api/types/get-l1-delegator";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN,
  DEFAULT_CHAIN_ID,
  l1Provider,
  L1_CHAIN_ID,
} from "@lib/chains";
import { EMPTY_ADDRESS } from "@lib/utils";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import {
  Controller__factory,
  L1BondingManager__factory,
  RoundsManager__factory,
} from "typechain-types";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<L1Delegator | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("day"));

      const { address } = req.query;

      if (isValidAddress(address)) {
        const l1Controller = Controller__factory.connect(
          CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
          l1Provider
        );

        const bondingManagerHash = keccak256(toUtf8Bytes("BondingManager"));
        const bondingManagerAddress = await l1Controller.getContract(
          bondingManagerHash
        );

        const roundsManagerHash = keccak256(toUtf8Bytes("RoundsManager"));
        const roundsManagerAddress = await l1Controller.getContract(
          roundsManagerHash
        );

        const roundsManager = RoundsManager__factory.connect(
          roundsManagerAddress,
          l1Provider
        );

        const currentRound = await roundsManager.currentRound();

        const l1BondingManager = L1BondingManager__factory.connect(
          bondingManagerAddress,
          l1Provider
        );

        const pendingStake = await l1BondingManager.pendingStake(
          address,
          currentRound
        );
        const pendingFees = await l1BondingManager.pendingFees(
          address,
          currentRound
        );
        const delegator = await l1BondingManager.getDelegator(address);

        let unbondingLockId = Number(delegator.nextUnbondingLockId);
        if (unbondingLockId > 0) {
          unbondingLockId -= 1;
        }

        const unbondingLocks: UnbondingLock[] = [];

        while (unbondingLockId >= 0) {
          const lock = await l1BondingManager.getDelegatorUnbondingLock(
            address,
            unbondingLockId
          );
          unbondingLocks.push({
            id: unbondingLockId,
            amount: lock.amount.toString(),
            withdrawRound: lock.withdrawRound.toString(),
          });
          unbondingLockId -= 1;
        }

        const delegateAddress =
          delegator.delegateAddress === EMPTY_ADDRESS
            ? ""
            : delegator.delegateAddress;

        const transcoderStatus = await l1BondingManager.transcoderStatus(
          address
        );

        const l1Delegator: L1Delegator = {
          transcoderStatus:
            transcoderStatus === 0 ? "not-registered" : "registered",
          delegateAddress,
          pendingStake: pendingStake.toString(),
          pendingFees: pendingFees.toString(),
          unbondingLocks,
          activeLocks: unbondingLocks.filter(
            (lock) => lock.withdrawRound != "0"
          ),
        };

        return res.status(200).json(l1Delegator);
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
