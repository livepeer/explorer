/**
 * The parts of Livepeer's L2Migrator (livepeer/arbitrum-lpt-bridge) the
 * explorer uses: claiming stake and fees from the LIP-73 migration
 * snapshot, and whether an address has already claimed or migrated.
 */
export const l2Migrator = [
  {
    type: "function",
    name: "claimStake",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_delegate", type: "address" },
      { name: "_stake", type: "uint256" },
      { name: "_fees", type: "uint256" },
      { name: "_proof", type: "bytes32[]" },
      { name: "_newDelegate", type: "address" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "migratedDelegators",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "claimStakeEnabled",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "delegatorPools",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

/** A migrated orchestrator's DelegatorPool: what's left to be claimed. */
export const delegatorPool = [
  {
    type: "function",
    name: "initialStake",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "claimedInitialStake",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
