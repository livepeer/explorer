/** @jest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { useAccount } from "wagmi";

import { useIsSafe } from "./wallet";

jest.mock("wagmi", () => {
  const { useQuery } = jest.requireActual("@tanstack/react-query");
  return {
    useAccount: jest.fn(),
    useReadContract: ({ address, query }: { address: string; query: object }) =>
      useQuery({
        queryKey: ["getThreshold", address],
        queryFn: () => mockReadThreshold(),
        ...query,
      }),
  };
});
const mockReadThreshold = jest.fn();

// The confirmation content mounts another consumer (its receipt header) once
// detection settles. An EOA's failed probe must not restart on that mount.
function ReceiptHeader() {
  const isSafe = useIsSafe();
  return <span>{isSafe ? "View in Safe" : "Transfer Receipt"}</span>;
}

function Confirmation() {
  const isSafe = useIsSafe();
  if (isSafe === undefined) return <p>Checking wallet status...</p>;
  return (
    <>
      <p>{isSafe ? "Sent to Safe" : "Delegation submitted"}</p>
      <ReceiptHeader />
    </>
  );
}

beforeEach(() => {
  jest.mocked(useAccount).mockReturnValue({
    address: "0x1111111111111111111111111111111111111111",
    chain: { id: 42161 },
  } as unknown as ReturnType<typeof useAccount>);
});

function setup() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <Confirmation />
    </QueryClientProvider>
  );
}

it("keeps an EOA's completed probe settled when the receipt header mounts", async () => {
  mockReadThreshold.mockRejectedValueOnce(
    new Error("getThreshold returned no data")
  );
  // If an extra probe starts, leave it pending to expose the stuck dialog.
  mockReadThreshold.mockImplementation(() => new Promise(() => {}));
  setup();
  await waitFor(() =>
    expect(screen.getByText("Delegation submitted")).toBeTruthy()
  );
  expect(screen.queryByText("Checking wallet status...")).toBeNull();
  expect(mockReadThreshold).toHaveBeenCalledTimes(1);
});

it("keeps a Safe classified when the receipt header mounts", async () => {
  mockReadThreshold.mockResolvedValue(2n);
  setup();
  await waitFor(() => expect(screen.getByText("Sent to Safe")).toBeTruthy());
  expect(screen.getByText("View in Safe")).toBeTruthy();
  expect(mockReadThreshold).toHaveBeenCalledTimes(1);
});

it("does not start a Safe probe without a connected account", () => {
  jest.mocked(useAccount).mockReturnValue({} as ReturnType<typeof useAccount>);
  setup();
  expect(screen.getByText("Checking wallet status...")).toBeTruthy();
  expect(mockReadThreshold).not.toHaveBeenCalled();
});
