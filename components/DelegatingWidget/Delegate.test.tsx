/** @jest-environment jsdom */

import { trackTransaction } from "@lib/analytics";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useIsSafe } from "hooks/wallet";
import { ComponentProps, ReactNode, useState } from "react";
import { Hash } from "viem";

import Delegate from "./Delegate";

jest.mock("@lib/utils", () => ({
  MAXIMUM_VALUE_UINT256:
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
}));
jest.mock("@lib/analytics", () => ({ trackTransaction: jest.fn() }));
jest.mock("@rainbow-me/rainbowkit", () => ({
  useAddRecentTransaction: jest.fn(),
}));
jest.mock("hooks/wallet", () => ({ useIsSafe: jest.fn() }));
jest.mock("hooks/useContracts", () => ({
  useBondingManagerAddress: () => ({
    data: "0x0000000000000000000000000000000000000001",
  }),
  useLivepeerTokenAddress: () => ({
    data: "0x0000000000000000000000000000000000000002",
  }),
}));
jest.mock("hooks/useOrchestratorRewardCutSpike", () => ({
  useOrchestratorRewardCutSpike: () => null,
}));
jest.mock("../ProgressSteps", () => () => null);
jest.mock("@livepeer/design-system", () => {
  const Container = ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  );
  return {
    Box: Container,
    Flex: Container,
    Text: Container,
    Button: ({ children, disabled, onClick }: ComponentProps<"button">) => (
      <button disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ),
  };
});
const mockStore = {
  setLatestTransactionSummary: jest.fn(),
  setLatestTransactionDetails: jest.fn(),
  setLatestTransactionConfirmed: jest.fn(),
  setLatestTransactionError: jest.fn(),
};
jest.mock("hooks/useExplorerStore", () => ({
  useExplorerStore: () => mockStore,
}));
const mockWrite = jest.fn();
jest.mock("wagmi", () => {
  const { useMutation } = jest.requireActual("@tanstack/react-query");
  return {
    useConfig: () => ({}),
    useSimulateContract: ({ args }: { args: unknown[] }) => ({
      data: { request: { args } },
    }),
    // Use real mutation scheduling, including completion after unmounting.
    useWriteContract: () => {
      const mutation = useMutation({ mutationFn: mockWrite });
      return {
        ...mutation,
        writeContract: mutation.mutate,
        writeContractAsync: mutation.mutateAsync,
      };
    },
  };
});

const addRecentTransaction = jest.fn();
const hash = `0x${"1".repeat(64)}` as Hash;
const secondHash = `0x${"2".repeat(64)}` as Hash;
let resolveWrite: (hash: Hash) => void;
let rejectWrite: (error: Error) => void;
const to = "0x0000000000000000000000000000000000000003";

function Form({ initial = "1.25", transfer = false, allowance = 10n ** 24n }) {
  const [amount, setAmount] = useState(initial);
  return (
    <>
      <input
        aria-label="Amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      <Delegate
        to={to}
        amount={amount}
        isTransferStake={transfer}
        isMyTranscoder={true}
        tokenBalance={10n ** 24n}
        transferAllowance={allowance}
        reset={() => setAmount("")}
        hint={{
          oldDelegateNewPosPrev: "a",
          oldDelegateNewPosNext: "b",
          currDelegateNewPosPrev: "c",
          currDelegateNewPosNext: "d",
        }}
      />
    </>
  );
}

function setup(props: ComponentProps<typeof Form> = {}) {
  const client = new QueryClient();
  const view = render(
    <QueryClientProvider client={client}>
      <Form {...props} />
    </QueryClientProvider>
  );
  return { ...view, client };
}

beforeEach(() => {
  jest.mocked(useIsSafe).mockReturnValue(false);
  jest.mocked(useAddRecentTransaction).mockReturnValue(addRecentTransaction);
  mockWrite.mockImplementation(
    () =>
      new Promise<Hash>((resolve, reject) => {
        resolveWrite = resolve;
        rejectWrite = reject;
      })
  );
});

it("keeps the submitted amount after reset and later input edits", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  expect((screen.getByLabelText("Amount") as HTMLInputElement).value).toBe("");
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "7" } });
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  expect(mockWrite.mock.calls[0][0].args[0]).toBe(1250000000000000000n);
  await act(async () => resolveWrite(hash));
  await waitFor(() =>
    expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1)
  );
  expect(mockStore.setLatestTransactionDetails).toHaveBeenCalledWith(
    hash,
    "bond",
    expect.objectContaining({ amount: 1250000000000000000n, to })
  );
  expect(trackTransaction).toHaveBeenCalledTimes(1);
});

it.each(["Delegate", "Approve"])(
  "finishes %s after the staking form unmounts",
  async (action) => {
    const { unmount, client } = setup(
      action === "Approve" ? { allowance: 0n } : {}
    );
    fireEvent.click(screen.getByRole("button", { name: action }));
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    expect(mockStore.setLatestTransactionSummary).toHaveBeenCalledTimes(1);
    unmount();
    await act(async () => resolveWrite(hash));
    await waitFor(() =>
      expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1)
    );
    expect(client.getMutationCache().getAll()[0].state.status).toBe("success");
    expect(mockStore.setLatestTransactionDetails).toHaveBeenCalledWith(
      hash,
      action === "Approve" ? "approve" : "bond",
      expect.objectContaining({
        amount: mockWrite.mock.calls[0][0].args.at(
          action === "Approve" ? 1 : 0
        ),
      })
    );
    expect(addRecentTransaction).toHaveBeenCalledTimes(1);
    expect(trackTransaction).toHaveBeenCalledTimes(1);
  }
);

it("reports rejection after unmounting", async () => {
  const { unmount } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  unmount();
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => rejectWrite(new Error("User rejected the request")));
    await waitFor(() =>
      expect(mockStore.setLatestTransactionError).toHaveBeenCalledWith(
        "User rejected the request"
      )
    );
    expect(mockStore.setLatestTransactionConfirmed).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});

it.each([false, true])(
  "preserves zero-amount stake moves (Safe=%s)",
  async (isSafe) => {
    jest.mocked(useIsSafe).mockReturnValue(isSafe);
    const { unmount } = setup({ initial: "", transfer: true });
    fireEvent.click(
      screen.getByRole("button", { name: "Move Delegated Stake" })
    );
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => resolveWrite(hash));
    await waitFor(() =>
      expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1)
    );
    expect(mockStore.setLatestTransactionDetails).toHaveBeenCalledWith(
      hash,
      "bond",
      expect.objectContaining({ amount: 0n, isTransferStake: true })
    );
    expect(addRecentTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    expect(trackTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
  }
);

it.each([false, true])(
  "waits for wallet classification before tracking (Safe=%s)",
  async (isSafe) => {
    jest.mocked(useIsSafe).mockReturnValue(undefined);
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    await act(async () => resolveWrite(hash));
    await waitFor(() =>
      expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1)
    );
    expect(addRecentTransaction).not.toHaveBeenCalled();
    expect(trackTransaction).not.toHaveBeenCalled();
    jest.mocked(useIsSafe).mockReturnValue(isSafe);
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "7" },
    });
    expect(addRecentTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    expect(trackTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    if (!isSafe) {
      expect(trackTransaction).toHaveBeenCalledWith(
        expect.anything(),
        "bond",
        expect.objectContaining({ amount: 1250000000000000000n }),
        hash
      );
    }
  }
);

it("uses the new amount when retrying a wallet rejection", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () => rejectWrite(new Error("User rejected the request")));
    await waitFor(() =>
      expect(mockStore.setLatestTransactionError).toHaveBeenCalledTimes(1)
    );
  } finally {
    log.mockRestore();
  }
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "4" } });
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(2));
  await act(async () => resolveWrite(hash));
  await waitFor(() =>
    expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1)
  );
  expect(mockStore.setLatestTransactionDetails).toHaveBeenLastCalledWith(
    hash,
    "bond",
    expect.objectContaining({ amount: 4000000000000000000n })
  );
});

it("uses a fresh amount for a second submission", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  await act(async () => resolveWrite(hash));
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "3" } });
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(2));
  await act(async () => resolveWrite(secondHash));
  await waitFor(() =>
    expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(2)
  );
  expect(mockStore.setLatestTransactionDetails).toHaveBeenLastCalledWith(
    secondHash,
    "bond",
    expect.objectContaining({ amount: 3000000000000000000n })
  );
});
