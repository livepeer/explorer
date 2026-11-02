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
  getLogs: jest.fn(),
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

  it("has arrived when a retry of a gone ticket succeeded", async () => {
    const t = id(4);
    const manual = pad("0xabcd", { size: 32 });
    receipts({
      [t]: created(t),
      [retryTx(t)]: { status: "reverted" },
      [manual]: { status: "success" },
    });
    l2.readContract.mockRejectedValueOnce(noTicket());
    l2.getLogs.mockResolvedValueOnce([
      { args: { ticketId: t, retryTxHash: retryTx(t), sequenceNum: 0n } },
      { args: { ticketId: t, retryTxHash: manual, sequenceNum: 1n } },
    ]);
    await expect(ticketStatus(t)).resolves.toEqual({ status: "arrived" });
    expect(l2.getLogs).toHaveBeenCalledWith(
      expect.objectContaining({ args: { ticketId: t }, fromBlock: 1n })
    );
  });

  it("lapsed, not arrived, when it's gone with no retry succeeding", async () => {
    // Expired, or cancelled by its beneficiary, at any age.
    const t = id(5);
    receipts({ [t]: created(t), [retryTx(t)]: { status: "reverted" } });
    l2.readContract.mockRejectedValueOnce(noTicket());
    l2.getLogs.mockResolvedValueOnce([
      { args: { ticketId: t, retryTxHash: retryTx(t), sequenceNum: 0n } },
    ]);
    await expect(ticketStatus(t)).resolves.toEqual({ status: "lapsed" });
  });

  it("doesn't call it lapsed when a retry can't be read, and checks again", async () => {
    const t = id(8);
    const manual = pad("0xbeef", { size: 32 });
    const logs = [
      { args: { ticketId: t, retryTxHash: retryTx(t), sequenceNum: 0n } },
      { args: { ticketId: t, retryTxHash: manual, sequenceNum: 1n } },
    ];
    // The manual retry's receipt can't be read yet: not found.
    receipts({ [t]: created(t), [retryTx(t)]: { status: "reverted" } });
    l2.readContract.mockRejectedValueOnce(noTicket());
    l2.getLogs.mockResolvedValueOnce(logs);
    await expect(ticketStatus(t)).rejects.toThrow("not found");
    // Once it can, the deposit has arrived: nothing wrong was kept.
    receipts({
      [t]: created(t),
      [retryTx(t)]: { status: "reverted" },
      [manual]: { status: "success" },
    });
    l2.readContract.mockRejectedValueOnce(noTicket());
    l2.getLogs.mockResolvedValueOnce(logs);
    await expect(ticketStatus(t)).resolves.toEqual({ status: "arrived" });
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
