/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { useSimulateContract, useWriteContract } from "wagmi";

import { getDelegatorStatus } from "../../lib/utils";
import Footer from "./Footer";

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
    Button: ({ children, onClick, disabled }: ComponentProps<"button">) => (
      <button onClick={onClick} disabled={disabled}>
        {children}
      </button>
    ),
  };
});
jest.mock("./Delegate", () => ({ __esModule: true, default: () => null }));
jest.mock("hooks", () => ({
  useAccountAddress: () => "0x1111111111111111111111111111111111111111",
  useExpectedChainId: () => 1,
  useAccountBalanceData: () => null,
  usePendingFeesAndStakeData: () => ({ pendingStake: "10000000000000000000" }),
}));
jest.mock("lib/chains", () => ({ CHAIN_INFO: { 1: { label: "Test chain" } } }));
jest.mock("hooks/useContracts", () => ({
  useBondingManagerAddress: () => ({
    data: "0x2222222222222222222222222222222222222222",
  }),
}));
jest.mock("hooks/useSubmitTransaction", () => ({
  useSubmitTransaction: () => (write: () => unknown) => write(),
}));
jest.mock("@lib/utils", () => ({
  getDelegatorStatus: jest.fn(() => "Bonded"),
  getHint: () => ({
    newPosPrev: "0x0000000000000000000000000000000000000000",
    newPosNext: "0x0000000000000000000000000000000000000000",
  }),
  simulateNewActiveSetOrder: () => [],
}));
jest.mock("wagmi", () => ({
  useSimulateContract: jest.fn(),
  useWriteContract: jest.fn(),
}));

type Props = ComponentProps<typeof Footer>;
const address = "0x1111111111111111111111111111111111111111";
const writeContract = jest.fn();
const propsFor = (amount: string): Props => ({
  reset: jest.fn(),
  data: {
    amount,
    action: "undelegate",
    isTransferStake: false,
    isMyTranscoder: true,
    isDelegated: true,
    isWrongRouteChain: false,
    currentRound: undefined,
    transcoders: [],
    transcoder: { id: address } as Props["data"]["transcoder"],
    delegator: {
      id: address,
      delegate: { id: address },
    } as Props["data"]["delegator"],
    account: { id: address, idShort: "0x1111…1111", name: null },
  },
});

beforeEach(() => {
  (getDelegatorStatus as jest.Mock).mockReturnValue("Bonded");
  // Return a config even for disabled queries to model cached simulation data.
  (useSimulateContract as jest.Mock).mockImplementation((options) => ({
    data: { request: { args: options.args } },
  }));
  (useWriteContract as jest.Mock).mockReturnValue({
    writeContractAsync: writeContract,
  });
});

it.each(["", "1e", "abc", "0", "-1", "0.0000000000000000001"])(
  "keeps invalid or nonpositive amounts disabled without throwing: %s",
  (amount) => {
    render(<Footer {...propsFor(amount)} />);

    const simulation = (useSimulateContract as jest.Mock).mock.calls.at(-1)![0];
    expect(simulation.query.enabled).toBe(false);
    const button = screen.getByRole("button");
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(writeContract).not.toHaveBeenCalled();
  }
);

it("simulates and submits the exact parsed exponent amount", () => {
  render(<Footer {...propsFor("1.000000000000000001e0")} />);

  const simulation = (useSimulateContract as jest.Mock).mock.calls.at(-1)![0];
  expect(simulation.query.enabled).toBe(true);
  expect(simulation.args[0]).toBe(1000000000000000001n);
  fireEvent.click(screen.getByRole("button", { name: "Undelegate" }));
  expect(writeContract).toHaveBeenCalledWith({ args: simulation.args });
});

it("keeps pending delegators disabled even with a simulation config", () => {
  (getDelegatorStatus as jest.Mock).mockReturnValue("Pending");
  render(<Footer {...propsFor("1")} />);

  expect(
    (useSimulateContract as jest.Mock).mock.calls.at(-1)![0].query.enabled
  ).toBe(false);
  expect(screen.getByText(/Your account is in a pending state/)).toBeTruthy();
  expect(screen.queryByText(/Looking to move your delegated stake/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Undelegate" }));
  expect(writeContract).not.toHaveBeenCalled();
});

it("requires confirmation before unbonding all stake", () => {
  render(<Footer {...propsFor("1e1")} />);

  fireEvent.click(screen.getByRole("button", { name: "Undelegate" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(writeContract).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Yes, unbond my stake" }));
  expect(writeContract).toHaveBeenCalledWith({
    args: expect.arrayContaining([10000000000000000000n]),
  });
});

it("blocks confirmation if the amount becomes invalid while the dialog is open", () => {
  const { rerender } = render(<Footer {...propsFor("10")} />);
  fireEvent.click(screen.getByRole("button", { name: "Undelegate" }));

  rerender(<Footer {...propsFor("1e")} />);

  const confirm = screen.getByRole("button", { name: "Yes, unbond my stake" });
  expect((confirm as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(confirm);
  expect(writeContract).not.toHaveBeenCalled();
});
