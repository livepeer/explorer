import { type JsonFragment } from 'ethers';

export const l1Migrator: JsonFragment[] = [
  {
    type: "constructor",
    stateMutability: "nonpayable",
    inputs: [
      {
        type: "address",
        name: "_inbox",
        internalType: "address"
      },
      {
        type: "address",
        name: "_bondingManagerAddr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_ticketBrokerAddr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_l2MigratorAddr",
        internalType: "address"
      }
    ]
  },
  {
    type: "event",
    name: "MigrateDelegatorInitiated",
    inputs: [
      {
        type: "uint256",
        name: "seqNo",
        indexed: true,
        internalType: "uint256"
      },
      {
        type: "tuple",
        name: "params",
        indexed: false,
        internalType: "struct IMigrator.MigrateDelegatorParams",
        components: [
          {
            type: "address",
            name: "l1Addr",
            internalType: "address"
          },
          {
            type: "address",
            name: "l2Addr",
            internalType: "address"
          },
          {
            type: "uint256",
            name: "stake",
            internalType: "uint256"
          },
          {
            type: "uint256",
            name: "delegatedStake",
            internalType: "uint256"
          },
          {
            type: "uint256",
            name: "fees",
            internalType: "uint256"
          },
          {
            type: "address",
            name: "delegate",
            internalType: "address"
          }
        ]
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MigrateSenderInitiated",
    inputs: [
      {
        type: "uint256",
        name: "seqNo",
        indexed: true,
        internalType: "uint256"
      },
      {
        type: "tuple",
        name: "params",
        indexed: false,
        internalType: "struct IMigrator.MigrateSenderParams",
        components: [
          {
            type: "address",
            name: "l1Addr",
            internalType: "address"
          },
          {
            type: "address",
            name: "l2Addr",
            internalType: "address"
          },
          {
            type: "uint256",
            name: "deposit",
            internalType: "uint256"
          },
          {
            type: "uint256",
            name: "reserve",
            internalType: "uint256"
          }
        ]
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "MigrateUnbondingLocksInitiated",
    inputs: [
      {
        type: "uint256",
        name: "seqNo",
        indexed: true,
        internalType: "uint256"
      },
      {
        type: "tuple",
        name: "params",
        indexed: false,
        internalType: "struct IMigrator.MigrateUnbondingLocksParams",
        components: [
          {
            type: "address",
            name: "l1Addr",
            internalType: "address"
          },
          {
            type: "address",
            name: "l2Addr",
            internalType: "address"
          },
          {
            type: "uint256",
            name: "total",
            internalType: "uint256"
          },
          {
            type: "uint256[]",
            name: "unbondingLockIds",
            internalType: "uint256[]"
          }
        ]
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TxToL2",
    inputs: [
      {
        type: "address",
        name: "from",
        indexed: true,
        internalType: "address"
      },
      {
        type: "address",
        name: "to",
        indexed: true,
        internalType: "address"
      },
      {
        type: "uint256",
        name: "seqNum",
        indexed: true,
        internalType: "uint256"
      },
      {
        type: "bytes",
        name: "data",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "function",
    name: "bondingManagerAddr",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: "",
        internalType: "address"
      }
    ]
  },
  {
    type: "function",
    name: "getMigrateDelegatorParams",
    stateMutability: "view",
    inputs: [
      {
        type: "address",
        name: "_l1Addr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_l2Addr",
        internalType: "address"
      }
    ],
    outputs: [
      {
        type: "bytes",
        name: "data",
        internalType: "bytes"
      },
      {
        type: "tuple",
        name: "params",
        internalType: "struct IMigrator.MigrateDelegatorParams",
        components: [
          {
            type: "address",
            name: "l1Addr",
            internalType: "address"
          },
          {
            type: "address",
            name: "l2Addr",
            internalType: "address"
          },
          {
            type: "uint256",
            name: "stake",
            internalType: "uint256"
          },
          {
            type: "uint256",
            name: "delegatedStake",
            internalType: "uint256"
          },
          {
            type: "uint256",
            name: "fees",
            internalType: "uint256"
          },
          {
            type: "address",
            name: "delegate",
            internalType: "address"
          }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getMigrateSenderParams",
    stateMutability: "view",
    inputs: [
      {
        type: "address",
        name: "_l1Addr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_l2Addr",
        internalType: "address"
      }
    ],
    outputs: [
      {
        type: "bytes",
        name: "data",
        internalType: "bytes"
      },
      {
        type: "tuple",
        name: "params",
        internalType: "struct IMigrator.MigrateSenderParams",
        components: [
          {
            type: "address",
            name: "l1Addr",
            internalType: "address"
          },
          {
            type: "address",
            name: "l2Addr",
            internalType: "address"
          },
          {
            type: "uint256",
            name: "deposit",
            internalType: "uint256"
          },
          {
            type: "uint256",
            name: "reserve",
            internalType: "uint256"
          }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getMigrateUnbondingLocksParams",
    stateMutability: "view",
    inputs: [
      {
        type: "address",
        name: "_l1Addr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_l2Addr",
        internalType: "address"
      },
      {
        type: "uint256[]",
        name: "_unbondingLockIds",
        internalType: "uint256[]"
      }
    ],
    outputs: [
      {
        type: "bytes",
        name: "data",
        internalType: "bytes"
      },
      {
        type: "tuple",
        name: "params",
        internalType: "struct IMigrator.MigrateUnbondingLocksParams",
        components: [
          {
            type: "address",
            name: "l1Addr",
            internalType: "address"
          },
          {
            type: "address",
            name: "l2Addr",
            internalType: "address"
          },
          {
            type: "uint256",
            name: "total",
            internalType: "uint256"
          },
          {
            type: "uint256[]",
            name: "unbondingLockIds",
            internalType: "uint256[]"
          }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "inbox",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: "",
        internalType: "contract IInbox"
      }
    ]
  },
  {
    type: "function",
    name: "l2MigratorAddr",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: "",
        internalType: "address"
      }
    ]
  },
  {
    type: "function",
    name: "migrateDelegator",
    stateMutability: "payable",
    inputs: [
      {
        type: "address",
        name: "_l1Addr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_refundAddr",
        internalType: "address"
      },
      {
        type: "bytes",
        name: "_sig",
        internalType: "bytes"
      },
      {
        type: "uint256",
        name: "_maxGas",
        internalType: "uint256"
      },
      {
        type: "uint256",
        name: "_gasPriceBid",
        internalType: "uint256"
      },
      {
        type: "uint256",
        name: "_maxSubmissionCost",
        internalType: "uint256"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "migrateSender",
    stateMutability: "payable",
    inputs: [
      {
        type: "address",
        name: "_l1Addr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_l2Addr",
        internalType: "address"
      },
      {
        type: "bytes",
        name: "_sig",
        internalType: "bytes"
      },
      {
        type: "uint256",
        name: "_maxGas",
        internalType: "uint256"
      },
      {
        type: "uint256",
        name: "_gasPriceBid",
        internalType: "uint256"
      },
      {
        type: "uint256",
        name: "_maxSubmissionCost",
        internalType: "uint256"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "migrateUnbondingLocks",
    stateMutability: "payable",
    inputs: [
      {
        type: "address",
        name: "_l1Addr",
        internalType: "address"
      },
      {
        type: "address",
        name: "_l2Addr",
        internalType: "address"
      },
      {
        type: "uint256[]",
        name: "_unbondingLockIds",
        internalType: "uint256[]"
      },
      {
        type: "bytes",
        name: "_sig",
        internalType: "bytes"
      },
      {
        type: "uint256",
        name: "_maxGas",
        internalType: "uint256"
      },
      {
        type: "uint256",
        name: "_gasPriceBid",
        internalType: "uint256"
      },
      {
        type: "uint256",
        name: "_maxSubmissionCost",
        internalType: "uint256"
      }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "ticketBrokerAddr",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "address",
        name: "",
        internalType: "address"
      }
    ]
  }
];
