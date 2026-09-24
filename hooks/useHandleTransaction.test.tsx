/** @jest-environment jsdom */

import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { renderHook } from "@testing-library/react";

import { useExplorerStore } from "./useExplorerStore";
import { useHandleTransaction } from "./useHandleTransaction";
import { useIsSafe } from "./wallet";

jest.mock("@rainbow-me/rainbowkit", () => ({
  useAddRecentTransaction: jest.fn(),
}));
jest.mock("./useExplorerStore", () => ({
  useExplorerStore: jest.fn(),
}));
jest.mock("./wallet", () => ({
  useIsSafe: jest.fn(),
}));
jest.mock("viem", () => ({
  isHash: (value: string) => /^0x[0-9a-f]{64}$/i.test(value),
}));

const hash = `0x${"1".repeat(64)}` as `0x${string}`;
const addRecentTransaction = jest.fn();

beforeEach(() => {
  (useAddRecentTransaction as jest.Mock).mockReturnValue(addRecentTransaction);
  (useExplorerStore as unknown as jest.Mock).mockReturnValue({
    setLatestTransactionError: jest.fn(),
    setLatestTransactionSummary: jest.fn(),
    setLatestTransactionConfirmed: jest.fn(),
    setLatestTransactionDetails: jest.fn(),
  });
});

it("never tracks a Safe proposal that arrives before Safe detection finishes", () => {
  (useIsSafe as jest.Mock).mockReturnValue(undefined);
  const { rerender } = renderHook(() =>
    useHandleTransaction("vote", hash, null, false, true, {})
  );

  expect(addRecentTransaction).not.toHaveBeenCalled();

  (useIsSafe as jest.Mock).mockReturnValue(true);
  rerender();

  expect(addRecentTransaction).not.toHaveBeenCalled();
});

it("tracks an EOA transaction once after detection finishes", () => {
  (useIsSafe as jest.Mock).mockReturnValue(undefined);
  const { rerender } = renderHook(() =>
    useHandleTransaction("vote", hash, null, false, true, {})
  );

  expect(addRecentTransaction).not.toHaveBeenCalled();

  (useIsSafe as jest.Mock).mockReturnValue(false);
  rerender();
  rerender();

  expect(addRecentTransaction).toHaveBeenCalledTimes(1);
  expect(addRecentTransaction).toHaveBeenCalledWith({
    hash,
    description: "Vote",
  });
});
