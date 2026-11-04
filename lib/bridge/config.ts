/**
 * The LPT bridge between Ethereum and Arbitrum: Livepeer's own gateways
 * (docs.livepeer.org/network/reference/contracts) and Arbitrum One's
 * Outbox, which pays withdrawals out on Ethereum. Each was checked
 * on-chain: the gateway routers resolve LPT to these gateways, the gateways
 * name each other as counterparts, and the rollup names this Outbox.
 */
export const L1_LPT = "0x58b6A8A3302369DAEc383334672404Ee733aB239";
export const L2_LPT = "0x289ba1701C2F088cf0faf8B3705246331cB8A839";
export const L1_LPT_GATEWAY = "0x6142f1C8bBF02E6A6bd074E8d564c9A5420a0676";
export const L2_LPT_GATEWAY = "0x6D2457a4ad276000A615295f7A80F79E48CcD318";
export const ARB_OUTBOX = "0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840";
/** Deposits go through Arbitrum's router, as on its bridge site. */
export const L1_GATEWAY_ROUTER = "0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef";
/** Withdrawals go through Arbitrum's router too (it resolves LPT's gateway). */
export const L2_GATEWAY_ROUTER = "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933";
/** Where the Ethereum gateway sends deposits (its own inbox()). */
export const ARB_INBOX = "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f";
/** Arbitrum One's bridge on Ethereum: it lists the outboxes it honors. */
export const ARB_BRIDGE = "0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a";
/**
 * Arbitrum's public RPC: the one that serves log queries over 10M blocks,
 * which the withdrawal index needs (keyed providers allow 10k).
 */
export const ARB_PUBLIC_RPC = "https://arb1.arbitrum.io/rpc";
export const LOG_RANGE = 10_000_000n;

/**
 * Arbitrum's Nitro upgrade. Withdrawals from before it were paid out by
 * older outboxes with their own bookkeeping, so they aren't tracked here.
 */
export const NITRO_L2_BLOCK = 22_207_817n;

export const withdrawalInitiated = {
  type: "event",
  name: "WithdrawalInitiated",
  inputs: [
    { name: "l1Token", type: "address", indexed: false },
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "l2ToL1Id", type: "uint256", indexed: true },
    { name: "exitNum", type: "uint256", indexed: false },
    { name: "amount", type: "uint256", indexed: false },
  ],
} as const;

export const outboxAbi = [
  {
    type: "function",
    name: "isSpent",
    stateMutability: "view",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "event",
    name: "SendRootUpdated",
    inputs: [
      { name: "outputRoot", type: "bytes32", indexed: true },
      { name: "l2BlockHash", type: "bytes32", indexed: true },
    ],
  },
] as const;

/** Arbitrum's virtual contract for node queries, such as outbox proofs. */
export const NODE_INTERFACE = "0x00000000000000000000000000000000000000C8";

/** Ethereum's block explorer, for claims. */
export const l1TxUrl = (hash: string) => `https://etherscan.io/tx/${hash}`;

/** The message ArbSys records for each withdrawal: what the Outbox replays. */
export const l2ToL1Tx = {
  type: "event",
  name: "L2ToL1Tx",
  inputs: [
    { name: "caller", type: "address", indexed: false },
    { name: "destination", type: "address", indexed: true },
    { name: "hash", type: "uint256", indexed: true },
    { name: "position", type: "uint256", indexed: true },
    { name: "arbBlockNum", type: "uint256", indexed: false },
    { name: "ethBlockNum", type: "uint256", indexed: false },
    { name: "timestamp", type: "uint256", indexed: false },
    { name: "callvalue", type: "uint256", indexed: false },
    { name: "data", type: "bytes", indexed: false },
  ],
} as const;

export const nodeInterfaceAbi = [
  {
    type: "function",
    name: "constructOutboxProof",
    stateMutability: "view",
    inputs: [
      { name: "size", type: "uint64" },
      { name: "leaf", type: "uint64" },
    ],
    outputs: [
      { name: "send", type: "bytes32" },
      { name: "root", type: "bytes32" },
      { name: "proof", type: "bytes32[]" },
    ],
  },
] as const;

/** Claiming: the Outbox replays the message, which pays out the LPT. */
export const executeTransactionAbi = [
  {
    type: "function",
    name: "executeTransaction",
    stateMutability: "nonpayable",
    inputs: [
      { name: "proof", type: "bytes32[]" },
      { name: "index", type: "uint256" },
      { name: "l2Sender", type: "address" },
      { name: "to", type: "address" },
      { name: "l2Block", type: "uint256" },
      { name: "l1Block", type: "uint256" },
      { name: "l2Timestamp", type: "uint256" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/** What the claimed message calls on Ethereum's LPT gateway. */
export const finalizeInboundTransferAbi = [
  {
    type: "function",
    name: "finalizeInboundTransfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "l1Token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/* ── Withdrawals: Arbitrum → Ethereum ───────────────────────────────────── */

/** Starting a withdrawal on Arbitrum; `token` is the Ethereum LPT address. */
export const l2OutboundTransferAbi = [
  {
    type: "function",
    name: "outboundTransfer",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ type: "bytes" }],
  },
] as const;

/* ── Deposits: Ethereum → Arbitrum ──────────────────────────────────────── */

/** Starting a deposit; `data` is abi.encode(maxSubmissionCost, ""). */
export const outboundTransferAbi = [
  {
    type: "function",
    name: "outboundTransfer",
    stateMutability: "payable",
    inputs: [
      { name: "token", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "maxGas", type: "uint256" },
      { name: "gasPriceBid", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ type: "bytes" }],
  },
] as const;

/** The call a deposit makes on Arbitrum, as the Ethereum gateway builds it. */
export const getOutboundCalldataAbi = [
  {
    type: "function",
    name: "getOutboundCalldata",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "data", type: "bytes" },
    ],
    outputs: [{ type: "bytes" }],
  },
] as const;

export const inboxAbi = [
  {
    type: "function",
    name: "calculateRetryableSubmissionFee",
    stateMutability: "view",
    inputs: [
      { name: "dataLength", type: "uint256" },
      { name: "baseFee", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** Called through eth_estimateGas: the gas a deposit's message needs. */
export const estimateRetryableTicketAbi = [
  {
    type: "function",
    name: "estimateRetryableTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sender", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "to", type: "address" },
      { name: "l2CallValue", type: "uint256" },
      { name: "excessFeeRefundAddress", type: "address" },
      { name: "callValueRefundAddress", type: "address" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/** Arbitrum's tool for checking, and redeeming, a stuck deposit. */
export const retryableUrl = (l1Tx: string) =>
  `https://retryable-dashboard.arbitrum.io/tx/${l1Tx}`;
