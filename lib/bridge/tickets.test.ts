import {
  encodeAbiParameters,
  encodeEventTopics,
  type Hex,
  keccak256,
  type Log,
} from "viem";

import { ARB_BRIDGE, ARB_INBOX } from "./config";
import fixture from "./ticket.fixture.json";
import {
  inboxMessageDelivered,
  messageDelivered,
  retryableTicketId,
  ticketFromLogs,
} from "./tickets";

// A real LPT deposit (fixture.l1Tx): its Inbox message, and the ticket id
// Arbitrum One created for it (a transaction hash there).
describe("retryableTicketId", () => {
  it("matches the ticket Arbitrum created for a real deposit", () => {
    expect(
      retryableTicketId({
        messageNum: BigInt(fixture.messageNum),
        data: fixture.data as Hex,
        sender: fixture.sender as Hex,
        baseFeeL1: BigInt(fixture.baseFeeL1),
      })
    ).toBe(fixture.ticket);
  });

  it("changes with any field, so a wrong message can't match", () => {
    expect(
      retryableTicketId({
        messageNum: BigInt(fixture.messageNum) + 1n,
        data: fixture.data as Hex,
        sender: fixture.sender as Hex,
        baseFeeL1: BigInt(fixture.baseFeeL1),
      })
    ).not.toBe(fixture.ticket);
  });
});

/** The Inbox and Bridge logs for one message, as a receipt holds them. */
function messageLogs(messageNum: bigint, data: Hex): Log[] {
  const inbox = {
    address: ARB_INBOX,
    topics: encodeEventTopics({
      abi: [inboxMessageDelivered],
      args: { messageNum },
    }),
    data: encodeAbiParameters([{ type: "bytes" }], [data]),
  };
  const bridge = {
    address: ARB_BRIDGE,
    topics: encodeEventTopics({
      abi: [messageDelivered],
      args: {
        messageIndex: messageNum,
        beforeInboxAcc: `0x${"00".repeat(32)}`,
      },
    }),
    data: encodeAbiParameters(
      [
        { type: "address" },
        { type: "uint8" },
        { type: "address" },
        { type: "bytes32" },
        { type: "uint256" },
        { type: "uint64" },
      ],
      [
        ARB_INBOX,
        9,
        fixture.sender as Hex,
        keccak256(data),
        BigInt(fixture.baseFeeL1),
        0n,
      ]
    ),
  };
  return [inbox, bridge] as unknown as Log[];
}

describe("ticketFromLogs", () => {
  const seq = BigInt(fixture.messageNum);
  // Another message in the same transaction, listed first: a batch.
  const decoy = messageLogs(seq - 1n, fixture.data as Hex);
  const deposit = messageLogs(seq, fixture.data as Hex);

  it("picks the deposit's own message, not the first one", () => {
    expect(ticketFromLogs([...decoy, ...deposit], seq)).toBe(fixture.ticket);
  });

  it("finds nothing when the transaction has no such message", () => {
    expect(ticketFromLogs(decoy, seq)).toBeNull();
  });
});
