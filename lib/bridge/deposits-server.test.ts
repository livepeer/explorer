import { ContractFunctionRevertedError } from "viem";

import { arbRetryableTxAbi } from "./tickets";

const l2 = {
  getTransactionReceipt: jest.fn(),
  readContract: jest.fn(),
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

describe("ticketStatus", () => {
  it("is processing until Arbitrum creates the ticket", async () => {
    l2.getTransactionReceipt.mockRejectedValueOnce(new Error("not found"));
    await expect(ticketStatus("0x01")).resolves.toEqual({
      status: "processing",
    });
  });

  it("needs a retry while the ticket still holds a timeout", async () => {
    l2.getTransactionReceipt.mockResolvedValueOnce({ status: "success" });
    l2.readContract.mockResolvedValueOnce(1_800_000_000n);
    await expect(ticketStatus("0x02")).resolves.toEqual({
      status: "retry",
      retryBy: 1_800_000_000,
    });
  });

  it("has arrived once the ticket is gone, and remembers it", async () => {
    l2.getTransactionReceipt.mockResolvedValueOnce({ status: "success" });
    l2.readContract.mockRejectedValueOnce(noTicket());
    await expect(ticketStatus("0x03")).resolves.toEqual({
      status: "arrived",
    });
    l2.getTransactionReceipt.mockClear();
    await expect(ticketStatus("0x03")).resolves.toEqual({
      status: "arrived",
    });
    expect(l2.getTransactionReceipt).not.toHaveBeenCalled();
  });

  it("doesn't mistake another failure for arrival", async () => {
    l2.getTransactionReceipt.mockResolvedValueOnce({ status: "success" });
    l2.readContract.mockRejectedValueOnce(new Error("RPC down"));
    await expect(ticketStatus("0x04")).rejects.toThrow("RPC down");
  });
});
