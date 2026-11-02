import {
  ContractFunctionRevertedError,
  encodeAbiParameters,
  encodeEventTopics,
  type Hex,
  pad,
} from "viem";

import { ARB_RETRYABLE_TX, arbRetryableTxAbi } from "./tickets";

const l2 = {
  getTransactionReceipt: jest.fn(),
  readContract: jest.fn(),
  getBlock: jest.fn(),
};
jest.mock("./withdrawals-server", () => ({ l1: {}, l2 }));

// Loaded after the mock, so it reads Arbitrum through it.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ticketStatus } = require("./deposits-server");

const noTicket = () =>
  new ContractFunctionRevertedError({
    abi: arbRetryableTxAbi,
    data: "0x80698456",
    functionName: "getTimeout",
  });

const id = (n: number) => pad(`0x${n.toString(16)}`, { size: 32 });
const retryTx = (ticket: Hex) => pad(`0x${ticket.slice(-4)}ff`, { size: 32 });

/** The ticket's creation, logging its automatic redeem. */
const created = (ticket: Hex, status = "success") => ({
  status,
  blockNumber: 1n,
  logs: [
    {
      address: ARB_RETRYABLE_TX,
      topics: encodeEventTopics({
        abi: arbRetryableTxAbi,
        eventName: "RedeemScheduled",
        args: {
          ticketId: ticket,
          retryTxHash: retryTx(ticket),
          sequenceNum: 0n,
        },
      }),
      data: encodeAbiParameters(
        [
          { type: "uint64" },
          { type: "address" },
          { type: "uint256" },
          { type: "uint256" },
        ],
        [0n, "0x0000000000000000000000000000000000000001", 0n, 0n]
      ),
    },
  ],
});

/** Receipts by hash: the creation and its automatic redeem. */
const receipts = (byHash: Record<string, unknown>) =>
  l2.getTransactionReceipt.mockImplementation(({ hash }: { hash: Hex }) =>
    hash in byHash
      ? Promise.resolve(byHash[hash])
      : Promise.reject(new Error("not found"))
  );

const now = Math.floor(Date.now() / 1000);

beforeEach(() => jest.resetAllMocks());

describe("ticketStatus", () => {
  it("is processing until Arbitrum creates the ticket", async () => {
    receipts({});
    await expect(ticketStatus(id(1))).resolves.toEqual({
      status: "processing",
    });
  });

  it("has arrived when the automatic redeem succeeded, and remembers it", async () => {
    const t = id(2);
    receipts({ [t]: created(t), [retryTx(t)]: { status: "success" } });
    await expect(ticketStatus(t)).resolves.toEqual({ status: "arrived" });
    expect(l2.readContract).not.toHaveBeenCalled();
    l2.getTransactionReceipt.mockClear();
    await expect(ticketStatus(t)).resolves.toEqual({ status: "arrived" });
    expect(l2.getTransactionReceipt).not.toHaveBeenCalled();
  });

  it("needs a retry while the ticket still holds a timeout", async () => {
    const t = id(3);
    receipts({ [t]: created(t), [retryTx(t)]: { status: "reverted" } });
    l2.readContract.mockResolvedValueOnce(1_800_000_000n);
    await expect(ticketStatus(t)).resolves.toEqual({
      status: "retry",
      retryBy: 1_800_000_000,
    });
  });

  it("has arrived when a retried ticket is gone before it could expire", async () => {
    const t = id(4);
    receipts({ [t]: created(t), [retryTx(t)]: { status: "reverted" } });
    l2.readContract.mockRejectedValueOnce(noTicket());
    l2.getBlock.mockResolvedValueOnce({ timestamp: BigInt(now - 86_400) });
    await expect(ticketStatus(t)).resolves.toEqual({ status: "arrived" });
  });

  it("is unconfirmed, not arrived, when it's gone after it could expire", async () => {
    const t = id(5);
    receipts({ [t]: created(t), [retryTx(t)]: { status: "reverted" } });
    l2.readContract.mockRejectedValueOnce(noTicket());
    l2.getBlock.mockResolvedValueOnce({ timestamp: BigInt(now - 8 * 86_400) });
    await expect(ticketStatus(t)).resolves.toEqual({ status: "unconfirmed" });
  });

  it("failed when the ticket's creation reverted, never arrived", async () => {
    const t = id(6);
    receipts({ [t]: created(t, "reverted") });
    await expect(ticketStatus(t)).resolves.toEqual({ status: "failed" });
    expect(l2.readContract).not.toHaveBeenCalled();
  });

  it("doesn't mistake another failure for arrival", async () => {
    const t = id(7);
    receipts({ [t]: created(t), [retryTx(t)]: { status: "reverted" } });
    l2.readContract.mockRejectedValueOnce(new Error("RPC down"));
    await expect(ticketStatus(t)).rejects.toThrow("RPC down");
  });
});
