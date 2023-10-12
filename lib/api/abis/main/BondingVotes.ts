export const bondingVotes = [
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
    inputs: [
      {
        internalType: "uint256",
        name: "newValue",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "lastValue",
        type: "uint256",
      },
    ],
    name: "DecreasingValues",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "lastClaimRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxAllowed",
        type: "uint256",
      },
    ],
    name: "FutureLastClaimRound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "queryRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "maxAllowed",
        type: "uint256",
      },
    ],
    name: "FutureLookup",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "caller",
        type: "address",
      },
      {
        internalType: "address",
        name: "required",
        type: "address",
      },
    ],
    name: "InvalidCaller",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "checkpointRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "requiredRound",
        type: "uint256",
      },
    ],
    name: "InvalidStartRound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "checkpointRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "requiredRound",
        type: "uint256",
      },
    ],
    name: "InvalidTotalStakeCheckpointRound",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "transcoder",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "round",
        type: "uint256",
      },
    ],
    name: "MissingEarningsPool",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "bondingManagerFunction",
        type: "string",
      },
    ],
    name: "MustCallBondingManager",
    type: "error",
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
        indexed: true,
        internalType: "address",
        name: "fromDelegate",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toDelegate",
        type: "address",
      },
    ],
    name: "DelegateChanged",
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
        indexed: false,
        internalType: "uint256",
        name: "previousBalance",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newBalance",
        type: "uint256",
      },
    ],
    name: "DelegateVotesChanged",
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
        indexed: false,
        internalType: "uint256",
        name: "previousBondedAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "previousLastClaimRound",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newBondedAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newLastClaimRound",
        type: "uint256",
      },
    ],
    name: "DelegatorBondedAmountChanged",
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
    inputs: [],
    name: "CLOCK_MODE",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_startRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_bondedAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_delegateAddress",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_delegatedAmount",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_lastClaimRound",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_lastRewardRound",
        type: "uint256",
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
        name: "_totalStake",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "checkpointTotalActiveStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "clock",
    outputs: [
      {
        internalType: "uint48",
        name: "",
        type: "uint48",
      },
    ],
    stateMutability: "view",
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
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "delegate",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    name: "delegateBySig",
    outputs: [],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "delegatedAt",
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
        name: "_account",
        type: "address",
      },
    ],
    name: "delegates",
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
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "getPastTotalSupply",
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
        name: "_account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "getPastVotes",
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
        name: "_round",
        type: "uint256",
      },
    ],
    name: "getTotalActiveStakeAt",
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
        name: "_account",
        type: "address",
      },
    ],
    name: "getVotes",
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
        name: "_account",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_round",
        type: "uint256",
      },
    ],
    name: "getVotesAndDelegateAtRoundStart",
    outputs: [
      {
        internalType: "uint256",
        name: "votes",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "delegateAddress",
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
        name: "_account",
        type: "address",
      },
    ],
    name: "hasCheckpoint",
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
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
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
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "pure",
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
    inputs: [],
    name: "totalSupply",
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
] as const;
