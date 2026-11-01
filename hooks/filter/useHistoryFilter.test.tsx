/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { NextRouter, useRouter } from "next/router";

import { useHistoryFilter } from "./useHistoryFilter";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));

const events = [
  { __typename: "NewRoundEvent" },
  { __typename: "VoteEvent" },
  { __typename: "TreasuryVoteEvent" },
];
type Navigation = {
  query: NextRouter["query"];
  resolve: (completed: boolean) => void;
  reject: (error: Error) => void;
};
let router: NextRouter;
let navigations: Navigation[];
const push = jest.fn();
const cancelled = () =>
  Object.assign(new Error("Navigation cancelled"), { cancelled: true });

beforeEach(() => {
  navigations = [];
  router = {
    query: { account: "0xaccount" },
    pathname: "/accounts/[account]/history",
    asPath: "/accounts/0xaccount/history",
    isReady: true,
    push,
  } as unknown as NextRouter;
  jest.mocked(useRouter).mockImplementation(() => router);
  push.mockImplementation(
    ({ query }) =>
      new Promise<boolean>((resolve, reject) => {
        navigations.push({ query, resolve, reject });
      })
  );
});
afterEach(() => jest.restoreAllMocks());

const renderFilter = () => {
  const hook = renderHook(() => useHistoryFilter(events));
  const navigate = (query: NextRouter["query"]) => {
    router = { ...router, query };
    hook.rerender();
  };
  const finish = async (index: number) => {
    await act(async () => {
      navigate(navigations[index].query);
      navigations[index].resolve(true);
    });
  };
  return { ...hook, navigate, finish };
};

it("keeps rapid selections cumulative before rendering or URL navigation completes", async () => {
  const { result, finish } = renderFilter();
  act(() => {
    result.current.toggleEventType("VoteEvent");
    result.current.toggleEventType("TreasuryVoteEvent");
  });
  expect(result.current.selectedEventTypes).toEqual([
    "VoteEvent",
    "TreasuryVoteEvent",
  ]);
  expect(result.current.filteredEvents).toEqual(events.slice(1));
  expect(navigations.map(({ query }) => query.eventTypes)).toEqual([
    "VoteEvent",
    "VoteEvent,TreasuryVoteEvent",
  ]);

  // An intermediate URL must not roll back the newer optimistic selection.
  await finish(0);
  expect(result.current.selectedEventTypes).toEqual([
    "VoteEvent",
    "TreasuryVoteEvent",
  ]);
  act(() => result.current.toggleEventType("NewRoundEvent"));
  expect(navigations[2].query.eventTypes).toBe(
    "VoteEvent,TreasuryVoteEvent,NewRoundEvent"
  );
  await finish(1);
  expect(result.current.selectedEventTypes).toEqual([
    "VoteEvent",
    "TreasuryVoteEvent",
    "NewRoundEvent",
  ]);
  await finish(2);
  expect(result.current.selectedEventTypes).toEqual([
    "VoteEvent",
    "TreasuryVoteEvent",
    "NewRoundEvent",
  ]);
  expect(router.query.eventTypes).toBe(
    "VoteEvent,TreasuryVoteEvent,NewRoundEvent"
  );
});

it.each(["toggle", "clear"])(
  "applies %s to a selection whose navigation is still pending",
  async (action) => {
    router.query.eventTypes = "NewRoundEvent";
    const { result, finish } = renderFilter();
    act(() => {
      result.current.toggleEventType("VoteEvent");
      if (action === "clear") result.current.clearFilters();
      else result.current.toggleEventType("VoteEvent");
    });
    const expected = action === "clear" ? [] : ["NewRoundEvent"];
    expect(result.current.selectedEventTypes).toEqual(expected);
    expect(navigations[1].query.eventTypes).toBe(
      action === "clear" ? undefined : "NewRoundEvent"
    );
    await finish(0);
    expect(result.current.selectedEventTypes).toEqual(expected);
    await finish(1);
    expect(result.current.selectedEventTypes).toEqual(expected);
    expect(result.current.filteredEvents).toEqual(
      action === "clear" ? events : [events[0]]
    );
  }
);

it("restores browser Back and Forward selections after navigation settles", async () => {
  const { result, finish, navigate } = renderFilter();
  act(() => result.current.toggleEventType("VoteEvent"));
  await finish(0);
  act(() => navigate({ account: "0xaccount" }));
  expect(result.current.selectedEventTypes).toEqual([]);
  expect(result.current.filteredEvents).toEqual(events);
  act(() => navigate({ account: "0xaccount", eventTypes: "VoteEvent" }));
  expect(result.current.selectedEventTypes).toEqual(["VoteEvent"]);
  expect(result.current.filteredEvents).toEqual([events[1]]);
  expect(push).toHaveBeenCalledTimes(1);
});

it("uses the browser URL when Back cancels a pending filter navigation", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  router.query.eventTypes = "TreasuryVoteEvent";
  const { result, navigate, finish } = renderFilter();
  act(() => result.current.toggleEventType("VoteEvent"));
  await act(async () => {
    navigate({ account: "0xaccount", eventTypes: "NewRoundEvent" });
    navigations[0].reject(cancelled());
  });
  expect(result.current.selectedEventTypes).toEqual(["NewRoundEvent"]);
  expect(result.current.filteredEvents).toEqual([events[0]]);
  expect(log).not.toHaveBeenCalled();
  act(() => result.current.toggleEventType("TreasuryVoteEvent"));
  expect(navigations[1].query.eventTypes).toBe(
    "NewRoundEvent,TreasuryVoteEvent"
  );
  await finish(1);
});

it.each(["false", "reject"])(
  "restores the current URL after a failed navigation (%s)",
  async (failure) => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    router.query.eventTypes = "NewRoundEvent";
    const { result, finish } = renderFilter();
    act(() => result.current.toggleEventType("VoteEvent"));
    expect(result.current.selectedEventTypes).toEqual([
      "NewRoundEvent",
      "VoteEvent",
    ]);
    await act(async () => {
      if (failure === "false") navigations[0].resolve(false);
      else navigations[0].reject(new Error("Navigation failed"));
    });
    expect(result.current.selectedEventTypes).toEqual(["NewRoundEvent"]);
    expect(result.current.filteredEvents).toEqual([events[0]]);
    expect(log).toHaveBeenCalledTimes(failure === "false" ? 0 : 1);
    act(() => result.current.toggleEventType("TreasuryVoteEvent"));
    expect(navigations[1].query.eventTypes).toBe(
      "NewRoundEvent,TreasuryVoteEvent"
    );
    await finish(1);
  }
);

it("does not clear a newer selection when an older navigation is cancelled", async () => {
  const { result, finish } = renderFilter();
  act(() => result.current.toggleEventType("VoteEvent"));
  act(() => result.current.toggleEventType("TreasuryVoteEvent"));
  await act(async () => navigations[0].reject(cancelled()));
  expect(result.current.selectedEventTypes).toEqual([
    "VoteEvent",
    "TreasuryVoteEvent",
  ]);
  await finish(1);
  expect(result.current.selectedEventTypes).toEqual([
    "VoteEvent",
    "TreasuryVoteEvent",
  ]);
});
