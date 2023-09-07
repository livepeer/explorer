export const bondingManager = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_controller",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "newDelegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "oldDelegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "additionalAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bondedAmount",
        type: "uint256",
      },
    ],
    name: "Bond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rewards",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "fees",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "startRound",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "endRound",
        type: "uint256",
      },
    ],
    name: "EarningsClaimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "param",
        type: "string",
      },
    ],
    name: "ParameterUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "unbondingLockId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Rebond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Reward",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "controller",
        type: "address",
      },
    ],
    name: "SetController",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "activationRound",
        type: "uint256",
      },
    ],
    name: "TranscoderActivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "deactivationRound",
        type: "uint256",
      },
    ],
    name: "TranscoderDeactivated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "finder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "penalty",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "finderReward",
        type: "uint256",
      },
    ],
    name: "TranscoderSlashed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "rewardCut",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "feeShare",
        type: "uint256",
      },
    ],
    name: "TranscoderUpdate",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldDelegator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newDelegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "oldUnbondingLockId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newUnbondingLockId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TransferBond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "treasury",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TreasuryReward",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "unbondingLockId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawRound",
        type: "uint256",
      },
    ],
    name: "Unbond",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "WithdrawFees",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "unbondingLockId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "withdrawRound",
        type: "uint256",
      },
    ],
    name: "WithdrawStake",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
    ],
    name: "bond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "address",
        name: "_oldDelegateNewPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_oldDelegateNewPosNext",
        type: "address",
      },
      {
        internalType: "address",
        name: "_currDelegateNewPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_currDelegateNewPosNext",
        type: "address",
      },
    ],
    name: "bondForWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "address",
        name: "_oldDelegateNewPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_oldDelegateNewPosNext",
        type: "address",
      },
      {
        internalType: "address",
        name: "_currDelegateNewPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_currDelegateNewPosNext",
        type: "address",
      },
    ],
    name: "bondWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
    ],
    name: "checkpointBondingState",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_endRound",
        type: "uint256",
      },
    ],
    name: "claimEarnings",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "controller",
    outputs: [
      {
        internalType: "contract IController",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "currentRoundTotalActiveStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
    ],
    name: "delegatorStatus",
    outputs: [
      {
        internalType: "enum BondingManager.DelegatorStatus",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
    ],
    name: "getDelegator",
    outputs: [
      {
        internalType: "uint256",
        name: "bondedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "fees",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "delegateAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "delegatedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "startRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastClaimRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "nextUnbondingLockId",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
    ],
    name: "getDelegatorUnbondingLock",
    outputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "withdrawRound",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getFirstTranscoderInPool",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
    ],
    name: "getNextTranscoderInPool",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalBonded",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
    ],
    name: "getTranscoder",
    outputs: [
      {
        internalType: "uint256",
        name: "lastRewardRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "rewardCut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "feeShare",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastActiveStakeUpdateRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "activationRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "deactivationRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "activeCumulativeRewards",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "cumulativeRewards",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "cumulativeFees",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastFeeRound",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "getTranscoderEarningsPoolForRound",
    outputs: [
      {
        internalType: "uint256",
        name: "totalStake",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "transcoderRewardCut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "transcoderFeeShare",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "cumulativeRewardFactor",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "cumulativeFeeFactor",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTranscoderPoolMaxSize",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTranscoderPoolSize",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
    ],
    name: "isActiveTranscoder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
    ],
    name: "isRegisteredTranscoder",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
    ],
    name: "isValidUnbondingLock",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextRoundTotalActiveStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextRoundTreasuryRewardCutRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_endRound",
        type: "uint256",
      },
    ],
    name: "pendingFees",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_endRound",
        type: "uint256",
      },
    ],
    name: "pendingStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
    ],
    name: "rebond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
    ],
    name: "rebondFromUnbonded",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_newPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newPosNext",
        type: "address",
      },
    ],
    name: "rebondFromUnbondedWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_newPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newPosNext",
        type: "address",
      },
    ],
    name: "rebondWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "reward",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_newPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newPosNext",
        type: "address",
      },
    ],
    name: "rewardWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_controller",
        type: "address",
      },
    ],
    name: "setController",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "setCurrentRoundTotalActiveStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_numActiveTranscoders",
        type: "uint256",
      },
    ],
    name: "setNumActiveTranscoders",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_ceiling",
        type: "uint256",
      },
    ],
    name: "setTreasuryBalanceCeiling",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_cutRate",
        type: "uint256",
      },
    ],
    name: "setTreasuryRewardCutRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint64",
        name: "_unbondingPeriod",
        type: "uint64",
      },
    ],
    name: "setUnbondingPeriod",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
      {
        internalType: "address",
        name: "_finder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_slashAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_finderFee",
        type: "uint256",
      },
    ],
    name: "slashTranscoder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "targetContractId",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rewardCut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_feeShare",
        type: "uint256",
      },
    ],
    name: "transcoder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
    ],
    name: "transcoderStatus",
    outputs: [
      {
        internalType: "enum BondingManager.TranscoderStatus",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
    ],
    name: "transcoderTotalStake",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_rewardCut",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_feeShare",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_newPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newPosNext",
        type: "address",
      },
    ],
    name: "transcoderWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_delegator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_oldDelegateNewPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_oldDelegateNewPosNext",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newDelegateNewPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newDelegateNewPosNext",
        type: "address",
      },
    ],
    name: "transferBond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "treasuryBalanceCeiling",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "treasuryRewardCutRate",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "unbond",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_newPosPrev",
        type: "address",
      },
      {
        internalType: "address",
        name: "_newPosNext",
        type: "address",
      },
    ],
    name: "unbondWithHint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unbondingPeriod",
    outputs: [
      {
        internalType: "uint64",
        name: "",
        type: "uint64",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_transcoder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_fees",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "updateTranscoderWithFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_amount",
        type: "uint256",
      },
    ],
    name: "withdrawFees",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_unbondingLockId",
        type: "uint256",
      },
    ],
    name: "withdrawStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
