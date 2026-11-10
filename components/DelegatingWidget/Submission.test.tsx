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
import { useExplorerStore } from "hooks/useExplorerStore";
import { useIsSafe } from "hooks/wallet";
import { ComponentProps, ReactNode, useState } from "react";
import { ContractFunctionZeroDataError, Hash, parseUnits } from "viem";

import Delegate from "./Delegate";
import Undelegate from "./Undelegate";

jest.mock("@lib/utils", () => ({
  MAXIMUM_VALUE_UINT256:
    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
}));
jest.mock("@lib/analytics", () => ({ trackTransaction: jest.fn() }));
jest.mock("@rainbow-me/rainbowkit", () => ({
  useAddRecentTransaction: jest.fn(),
}));
jest.mock("hooks/wallet", () => ({
  ...jest.requireActual("hooks/wallet"),
  useIsSafe: jest.fn(),
}));
jest.mock("hooks", () => ({
  useAccountAddress: () => "0x1111111111111111111111111111111111111111",
}));
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
    DialogContent: Container,
    DialogTitle: Container,
    Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
      open ? <div role="dialog">{children}</div> : null,
    Button: ({ children, disabled, onClick }: ComponentProps<"button">) => (
      <button disabled={disabled} onClick={onClick}>
        {children}
      </button>
    ),
  };
});
const initialStore = useExplorerStore.getState();
const mockStore = {
  setLatestTransactionSummary: jest.fn(
    initialStore.setLatestTransactionSummary
  ),
  setLatestTransactionDetails: jest.fn(
    initialStore.setLatestTransactionDetails
  ),
  setLatestTransactionConfirmed: jest.fn(
    initialStore.setLatestTransactionConfirmed
  ),
  setLatestTransactionError: jest.fn(initialStore.setLatestTransactionError),
};
const mockWrite = jest.fn();
const mockReadSafe = jest.fn();
let mockChainId = 42161;
const mockConfig = { getClient: () => ({ readContract: mockReadSafe }) };
jest.mock("wagmi", () => {
  const { useMutation } = jest.requireActual("@tanstack/react-query");
  return {
    useConfig: () => mockConfig,
    useAccount: () => ({
      address: "0x1111111111111111111111111111111111111111",
      chainId: mockChainId,
    }),
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

function Form({
  initial = "1.25",
  transfer = false,
  allowance = 10n ** 24n,
  undelegate = false,
  willDeactivate = false,
}) {
  const [amount, setAmount] = useState(initial);
  return (
    <>
      <input
        aria-label="Amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
      />
      {undelegate ? (
        <Undelegate
          amount={amount}
          amountWei={parseUnits(amount, 18)}
          newPosPrev="a"
          newPosNext="b"
          disabled={false}
          willDeactivate={willDeactivate}
        />
      ) : (
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
      )}
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
  mockChainId = 42161;
  useExplorerStore.setState({ ...initialStore, ...mockStore });
  mockReadSafe.mockReset();
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

afterEach(() => jest.restoreAllMocks());

function deferSafeProbe() {
  let resolveProbe: (threshold: bigint) => void;
  let rejectProbe: (error: Error) => void;
  const probe = new Promise<bigint>((resolve, reject) => {
    resolveProbe = resolve;
    rejectProbe = reject;
  });
  mockReadSafe.mockReturnValueOnce(probe);
  return {
    settle: (isSafe: boolean) =>
      isSafe
        ? resolveProbe(2n)
        : rejectProbe(
            new ContractFunctionZeroDataError({ functionName: "getThreshold" })
          ),
    reject: (error: Error) => rejectProbe(error),
  };
}

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

it.each(["Delegate", "Approve", "Undelegate"])(
  "finishes %s after the staking form unmounts",
  async (action) => {
    const { unmount, client } = setup(
      action === "Approve"
        ? { allowance: 0n }
        : { undelegate: action === "Undelegate" }
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
      action === "Approve"
        ? "approve"
        : action === "Undelegate"
        ? "unbond"
        : "bond",
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

it("keeps the submitted undelegation amount while the input changes", async () => {
  setup({ undelegate: true });
  fireEvent.click(screen.getByRole("button", { name: "Undelegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "7" } });
  await act(async () => resolveWrite(hash));

  expect(useExplorerStore.getState().latestTransaction).toMatchObject({
    hash,
    step: "confirmed",
    name: "unbond",
    inputData: { amount: 1250000000000000000n, wasDeactivated: false },
  });
});

it.each(["Delegate", "Undelegate"])(
  "reports %s rejection after unmounting",
  async (action) => {
    const { unmount } = setup({ undelegate: action === "Undelegate" });
    fireEvent.click(screen.getByRole("button", { name: action }));
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    unmount();
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    try {
      await act(async () =>
        rejectWrite(new Error("User rejected the request"))
      );
      await waitFor(() =>
        expect(mockStore.setLatestTransactionError).toHaveBeenCalledWith(
          "User rejected the request"
        )
      );
      expect(mockStore.setLatestTransactionConfirmed).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  }
);

it.each([false, true])(
  "finishes confirmed orchestrator deactivation after unmount (Safe=%s)",
  async (isSafe) => {
    jest.mocked(useIsSafe).mockReturnValue(isSafe);
    const { unmount } = setup({ undelegate: true, willDeactivate: true });
    fireEvent.click(screen.getByRole("button", { name: "Undelegate" }));
    expect(mockWrite).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Yes, unbond my stake" })
    );
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => resolveWrite(hash));
    expect(useExplorerStore.getState().latestTransaction).toMatchObject({
      hash,
      step: "confirmed",
      name: "unbond",
      inputData: { amount: 1250000000000000000n, wasDeactivated: true },
    });
    expect(addRecentTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    expect(trackTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
  }
);

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
    const probe = deferSafeProbe();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    await act(async () => resolveWrite(hash));
    await waitFor(() =>
      expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1)
    );
    expect(addRecentTransaction).not.toHaveBeenCalled();
    expect(trackTransaction).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Amount"), {
      target: { value: "7" },
    });
    await act(async () => probe.settle(isSafe));
    expect(addRecentTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    expect(trackTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    if (!isSafe) {
      expect(trackTransaction).toHaveBeenCalledWith(
        expect.anything(),
        "bond",
        expect.objectContaining({ amount: 1250000000000000000n }),
        hash,
        42161
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

it.each([false, true])(
  "finishes deferred classification after unmount (Safe=%s)",
  async (isSafe) => {
    jest.mocked(useIsSafe).mockReturnValue(undefined);
    const probe = deferSafeProbe();
    const { unmount } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
    await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => resolveWrite(hash));
    expect(useExplorerStore.getState().latestTransaction).toMatchObject({
      hash,
      step: "confirmed",
    });
    expect(trackTransaction).not.toHaveBeenCalled();
    await act(async () => probe.settle(isSafe));
    expect(addRecentTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    expect(trackTransaction).toHaveBeenCalledTimes(isSafe ? 0 : 1);
    expect(mockReadSafe).toHaveBeenCalledTimes(1);
  }
);

it("does not treat a failed RPC request as evidence of an EOA", async () => {
  jest.mocked(useIsSafe).mockReturnValue(undefined);
  const probe = deferSafeProbe();
  const { unmount } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  unmount();
  await act(async () => probe.reject(new Error("RPC unavailable")));
  await act(async () => resolveWrite(hash));
  expect(useExplorerStore.getState().latestTransaction).toMatchObject({
    hash,
    step: "confirmed",
  });
  expect(addRecentTransaction).not.toHaveBeenCalled();
  expect(trackTransaction).not.toHaveBeenCalled();
});

async function overlapDelegations() {
  const first = setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  const finishFirst = resolveWrite;
  const failFirst = rejectWrite;
  act(() => useExplorerStore.getState().clearLatestTransaction());
  first.unmount();
  setup({ initial: "3" });
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(2));
  return {
    finishFirst,
    failFirst,
    finishSecond: resolveWrite,
    pending: useExplorerStore.getState().latestTransaction,
  };
}

it.each([false, true])(
  "keeps the newer dialog when submissions overlap (older finishes first=%s)",
  async (olderFirst) => {
    const requests = await overlapDelegations();
    if (olderFirst) {
      await act(async () => requests.finishFirst(hash));
      expect(useExplorerStore.getState().latestTransaction).toEqual(
        requests.pending
      );
      expect(mockStore.setLatestTransactionConfirmed).not.toHaveBeenCalled();
    }
    await act(async () => requests.finishSecond(secondHash));
    if (!olderFirst) await act(async () => requests.finishFirst(hash));
    expect(useExplorerStore.getState().latestTransaction).toMatchObject({
      hash: secondHash,
      step: "confirmed",
      inputData: { amount: 3000000000000000000n },
    });
    expect(mockStore.setLatestTransactionConfirmed).toHaveBeenCalledTimes(1);
    expect(addRecentTransaction).toHaveBeenCalledTimes(2);
    expect(trackTransaction).toHaveBeenCalledTimes(2);
  }
);

it("does not attach an older rejection to a newer confirmation", async () => {
  const requests = await overlapDelegations();
  await act(async () => requests.finishSecond(secondHash));
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    await act(async () =>
      requests.failFirst(new Error("Old request rejected"))
    );
  } finally {
    log.mockRestore();
  }
  expect(mockStore.setLatestTransactionError).not.toHaveBeenCalled();
  expect(useExplorerStore.getState().latestTransaction).toMatchObject({
    hash: secondHash,
    step: "confirmed",
  });
  expect(useExplorerStore.getState().latestTransaction?.error).toBeUndefined();
});

it("tracks a dismissed submission without reopening its dialog", async () => {
  setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  act(() => useExplorerStore.getState().clearLatestTransaction());
  await act(async () => resolveWrite(hash));
  expect(useExplorerStore.getState().latestTransaction).toBeNull();
  expect(mockStore.setLatestTransactionConfirmed).not.toHaveBeenCalled();
  expect(addRecentTransaction).toHaveBeenCalledTimes(1);
  expect(trackTransaction).toHaveBeenCalledTimes(1);
});

it("tracks the submitted chain after switching networks during classification", async () => {
  jest.mocked(useIsSafe).mockReturnValue(undefined);
  const probe = deferSafeProbe();
  const { unmount } = setup();
  fireEvent.click(screen.getByRole("button", { name: "Delegate" }));
  await waitFor(() => expect(mockWrite).toHaveBeenCalledTimes(1));
  await act(async () => resolveWrite(hash));
  unmount();
  mockChainId = 1;
  await act(async () => probe.settle(false));
  expect(trackTransaction).toHaveBeenCalledWith(
    mockConfig,
    "bond",
    expect.objectContaining({ amount: 1250000000000000000n }),
    hash,
    42161
  );
});
