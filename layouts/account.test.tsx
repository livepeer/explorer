/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { NextRouter, useRouter } from "next/router";
import { ReactNode } from "react";

import AccountLayout from "./account";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("next/dynamic", () => () => () => null);
jest.mock("@layouts/main", () => ({ getLayout: jest.fn() }));
jest.mock("apollo", () => ({ useAccountQuery: () => ({}) }));
jest.mock("hooks", () => ({
  useAccountAddress: () => undefined,
  useEnsData: () => undefined,
  useExplorerStore: () => ({ setSelectedStakingAction: jest.fn() }),
}));
jest.mock("hooks/useContracts", () => ({
  useBondingManagerAddress: () => ({}),
}));
jest.mock("wagmi", () => ({ useReadContract: () => ({}) }));
jest.mock("react-use", () => ({ useWindowSize: () => ({ width: 1000 }) }));
jest.mock(
  "@components/HorizontalScrollContainer",
  () =>
    function MockHorizontalScrollContainer({
      children,
    }: {
      children: ReactNode;
    }) {
      return <div>{children}</div>;
    }
);
jest.mock("@components/Profile", () => () => null);
jest.mock("@components/BottomDrawer", () => () => null);
jest.mock("@components/OrchestratingView", () => () => null);
jest.mock("@components/BroadcastingView", () => () => null);
jest.mock("@components/DelegatorsView", () => () => null);
jest.mock(
  "@components/HistoryView",
  () =>
    function MockHistoryView() {
      return <div>History content</div>;
    }
);

it.each([
  "",
  "?eventTypes=TreasuryVoteEvent",
  "?eventTypes=VoteEvent,TreasuryVoteEvent#history",
])("renders History and selects its tab with URL suffix %s", (suffix) => {
  jest.mocked(useRouter).mockReturnValue({
    query: { account: "0xaccount", eventTypes: "TreasuryVoteEvent" },
    pathname: "/accounts/[account]/history",
    asPath: `/accounts/0xaccount/history${suffix}`,
    isReady: true,
  } as unknown as NextRouter);

  render(
    <AccountLayout
      sortedOrchestrators={{ __typename: "Query", transcoders: [] }}
    />
  );

  expect(screen.getByText("History content")).toBeTruthy();
  expect(
    screen.getByRole("link", { name: "History" }).getAttribute("aria-current")
  ).toBe("page");
});
