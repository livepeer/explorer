import {
  concat,
  type Hex,
  isAddressEqual,
  keccak256,
  type Log,
  numberToHex,
  pad,
  parseAbiItem,
  parseEventLogs,
  toRlp,
  trim,
} from "viem";

import { ARB_BRIDGE, ARB_INBOX } from "./config";

/**
 * A deposit to Arbitrum is a "retryable ticket": Ethereum records the
 * message, Arbitrum creates the ticket and, paid from the deposit's fee,
 * redeems it at once, which mints the LPT. If that automatic redeem fails
 * (gas spiked past what was paid), the ticket waits for anyone to redeem it
 * by hand, for 7 days, after which it's discarded with the LPT locked on
 * Ethereum. These helpers find a deposit's ticket so its state can be read
 * instead of guessed from how long it's been (DepositStatus in types.ts).
 */
export const inboxMessageDelivered = parseAbiItem(
  "event InboxMessageDelivered(uint256 indexed messageNum, bytes data)"
);
export const messageDelivered = parseAbiItem(
  "event MessageDelivered(uint256 indexed messageIndex, bytes32 indexed beforeInboxAcc, address inbox, uint8 kind, address sender, bytes32 messageDataHash, uint256 baseFeeL1, uint64 timestamp)"
);

/** Arbitrum's ticket precompile: a ticket's expiry, while it waits. */
export const ARB_RETRYABLE_TX = "0x000000000000000000000000000000000000006E";
export const arbRetryableTxAbi = [
  {
    type: "function",
    name: "getTimeout",
    stateMutability: "view",
    inputs: [{ name: "ticketId", type: "bytes32" }],
    outputs: [{ type: "uint256" }],
  },
  { type: "error", name: "NoTicketWithID", inputs: [] },
] as const;

const ARBITRUM_ONE = 42161n;

/** A number as RLP wants it: big-endian, no leading zeros, 0 as empty. */
const num = (v: bigint): Hex => (v === 0n ? "0x" : trim(numberToHex(v)));

/**
 * The ticket's id, which is also the hash of the Arbitrum transaction that
 * creates it: the RLP of the submit-retryable transaction, type 0x69, as
 * Arbitrum's SDK computes it. `data` is the Inbox message: 32-byte words
 * for destination, call value, deposit, submission cost, the two refund
 * addresses, gas limit, gas price and data length, then the call data.
 */
export function retryableTicketId({
  messageNum,
  data,
  sender,
  baseFeeL1,
  chainId = ARBITRUM_ONE,
}: {
  messageNum: bigint;
  data: Hex;
  /** From MessageDelivered: the sending contract, already aliased. */
  sender: Hex;
  baseFeeL1: bigint;
  chainId?: bigint;
}): Hex {
  const body = data.slice(2);
  const word = (i: number) => BigInt(`0x${body.slice(i * 64, i * 64 + 64)}`);
  const address = (i: number) =>
    `0x${body.slice(i * 64 + 24, i * 64 + 64)}` as Hex;
  const length = Number(word(8));
  const callData = `0x${body.slice(9 * 64, 9 * 64 + length * 2)}` as Hex;
  return keccak256(
    concat([
      "0x69",
      toRlp([
        num(chainId),
        pad(num(messageNum), { size: 32 }),
        sender,
        num(baseFeeL1),
        num(word(2)), // deposit: the ETH sent along
        num(word(7)), // max fee per gas
        num(word(6)), // gas limit
        address(0), // destination
        num(word(1)), // call value
        address(5), // call value refund address
        num(word(3)), // max submission cost
        address(4), // excess fee refund address
        callData,
      ]),
    ])
  );
}

/**
 * The ticket for one deposit, from its Ethereum transaction's logs: the
 * Inbox message numbered `messageNum` (the gateway's deposit event carries
 * it as its sequence number) and the Bridge's record of it. One
 * transaction can carry several messages, e.g. a batch of deposits, so the
 * number, not the order, picks the right one. Only Arbitrum One's own Inbox
 * and Bridge count. Null if the transaction has no such message.
 */
export function ticketFromLogs(logs: Log[], messageNum: bigint): Hex | null {
  const inbox = parseEventLogs({
    abi: [inboxMessageDelivered],
    logs: logs.filter((l) => isAddressEqual(l.address, ARB_INBOX)),
  }).find((l) => l.args.messageNum === messageNum);
  const bridge = parseEventLogs({
    abi: [messageDelivered],
    logs: logs.filter((l) => isAddressEqual(l.address, ARB_BRIDGE)),
  }).find((l) => l.args.messageIndex === inbox?.args.messageNum);
  if (!inbox || !bridge) return null;
  return retryableTicketId({
    messageNum: inbox.args.messageNum,
    data: inbox.args.data,
    sender: bridge.args.sender,
    baseFeeL1: bridge.args.baseFeeL1,
  });
}
