import { l2Migrator, l2Provider } from "lib/chains";
import { ethers } from "ethers";

/**
 * Approve an amount for an ERC20 token transfer
 * @param obj
 * @param {string} type - The approval type
 * @param {string} amount - The approval amount
 * @return {Promise}
 */
export async function approve(_obj, _args, _ctx) {
  const { type, amount } = _args;
  const livepeerToken = new ethers.Contract(
    _ctx.livepeer.config.contracts.LivepeerToken.address,
    _ctx.livepeer.config.contracts.LivepeerToken.abi,
    l2Provider
  );
  const livepeerTokenWithSigner = livepeerToken.connect(_ctx.signer);

  switch (type) {
    case "bond":
      const approvalTx = await livepeerTokenWithSigner.approve(
        _ctx.livepeer.config.contracts.BondingManager.address,
        amount
      );

      return {
        txHash: approvalTx.hash,
        inputData: {
          ..._args,
        },
      };

    default:
      throw new Error(`Approval type "${type}" is not supported.`);
  }
}

/**
 * Submits a bond transaction for a previously approved amount
 * @param obj
 * @param {string} to - The ETH address of the delegate to bond to
 * @param {string} amount - The approval amount
 * @return {Promise}
 */
export async function bond(_obj, _args, _ctx) {
  const {
    amount,
    to,
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext,
  } = _args;

  const bondingManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.BondingManager.address,
    _ctx.livepeer.config.contracts.BondingManager.abi,
    l2Provider
  );

  const bondingManagerWithSigner = bondingManager.connect(_ctx.signer);
  const tx = await bondingManagerWithSigner.bondWithHint(
    amount,
    to,
    oldDelegateNewPosPrev,
    oldDelegateNewPosNext,
    currDelegateNewPosPrev,
    currDelegateNewPosNext
  );

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Submits an unbond transaction
 * @param obj
 * @return {Promise}
 */
export async function unbond(_obj, _args, _ctx) {
  const { amount, newPosPrev, newPosNext } = _args;
  const bondingManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.BondingManager.address,
    _ctx.livepeer.config.contracts.BondingManager.abi,
    l2Provider
  );

  const bondingManagerWithSigner = bondingManager.connect(_ctx.signer);
  const tx = await bondingManagerWithSigner.unbondWithHint(
    amount,
    newPosPrev,
    newPosNext
  );

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Submits a rebond transaction
 * @param obj
 * @return {Promise}
 */
export async function rebond(_obj, _args, _ctx) {
  const { unbondingLockId, newPosPrev, newPosNext } = _args;
  const bondingManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.BondingManager.address,
    _ctx.livepeer.config.contracts.BondingManager.abi,
    l2Provider
  );

  const bondingManagerWithSigner = bondingManager.connect(_ctx.signer);
  const tx = await bondingManagerWithSigner.rebondWithHint(
    unbondingLockId,
    newPosPrev,
    newPosNext
  );

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Submits a withdrawStake transaction
 * @param obj
 * @return {Promise}
 */
export async function withdrawStake(_obj, _args, _ctx) {
  const { unbondingLockId } = _args;
  const bondingManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.BondingManager.address,
    _ctx.livepeer.config.contracts.BondingManager.abi,
    l2Provider
  );

  const bondingManagerWithSigner = bondingManager.connect(_ctx.signer);
  const tx = await bondingManagerWithSigner.withdrawStake(unbondingLockId);

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Submits a withdrawFees transaction
 * @param obj
 * @return {Promise}
 */
export async function withdrawFees(_obj, _args, _ctx) {
  const { recipient, amount } = _args;
  const bondingManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.BondingManager.address,
    _ctx.livepeer.config.contracts.BondingManager.abi,
    l2Provider
  );

  const bondingManagerWithSigner = bondingManager.connect(_ctx.signer);
  const tx = await bondingManagerWithSigner.withdrawFees(recipient, amount);

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Submits a rebondFromUnbonded transaction
 * @param obj
 * @return {Promise}
 */
export async function rebondFromUnbonded(_obj, _args, _ctx) {
  const { delegate, unbondingLockId, newPosPrev, newPosNext } = _args;
  const bondingManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.BondingManager.address,
    _ctx.livepeer.config.contracts.BondingManager.abi,
    l2Provider
  );

  const bondingManagerWithSigner = bondingManager.connect(_ctx.signer);
  const tx = await bondingManagerWithSigner.rebondFromUnbondedWithHint(
    delegate,
    unbondingLockId,
    newPosPrev,
    newPosNext
  );

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Submits a round initialization transaction
 * @param obj
 * @return {Promise}
 */
export async function initializeRound(_obj, _args, _ctx) {
  const roundsManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.RoundsManager.address,
    _ctx.livepeer.config.contracts.RoundsManager.abi,
    l2Provider
  );
  const roundsManagerWithSigner = roundsManager.connect(_ctx.signer);

  const tx = await roundsManagerWithSigner.initializeRound();

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Creates a poll
 * @param obj
 * @return {Promise}
 */
export async function createPoll(_obj, _args, _ctx) {
  const { proposal } = _args;
  const pollCreator = new ethers.Contract(
    _ctx.livepeer.config.contracts.PollCreator.address,
    _ctx.livepeer.config.contracts.PollCreator.abi,
    l2Provider
  );
  const pollCreatorWithSigner = pollCreator.connect(_ctx.signer);

  const tx = await pollCreatorWithSigner.createPoll(
    ethers.utils.toUtf8Bytes(proposal)
  );

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
}

/**
 * Vote in a poll
 * @param obj
 * @return {Promise}
 */
export async function vote(_obj, _args, _ctx) {
  const { pollAddress, choiceId } = _args;
  const roundsManager = new ethers.Contract(
    _ctx.livepeer.config.contracts.RoundsManager.address,
    _ctx.livepeer.config.contracts.RoundsManager.abi,
    l2Provider
  );
  const roundsManagerWithSigner = roundsManager.connect(_ctx.signer);

  const tx = await roundsManagerWithSigner.initializeRound();

  return {
    txHash: tx.hash,
    inputData: {
      ..._args,
    },
  };
  // TODO
}

/**
 * Claim L2 stake
 * @param obj
 * @return {Promise}
 */
export async function claimStake(_obj, _args, _ctx) {
  try {
    const { delegate, stake, fees, proof, newDelegate } = _args;
    const l2MigratorWithSigner = l2Migrator.connect(_ctx.signer);
    const tx = await l2MigratorWithSigner.claimStake(
      delegate,
      stake,
      fees,
      proof,
      newDelegate
    );
    return {
      txHash: tx.hash,
      inputData: {
        ..._args,
      },
    };
  } catch (e) {
    console.log(e);
    throw new Error(e);
  }
}
