import { AccountQueryResult } from "apollo";
import { StakingAction } from "hooks";

import {
  abbreviateNumber,
  avg,
  checkAddressEquality,
  EMPTY_ADDRESS,
  formatAddress,
  fromWei,
  getDelegatorStatus,
  getHint,
  getPercentChange,
  isImageUrl,
  simulateNewActiveSetOrder,
  textTruncate,
  toWei,
} from "./utils";

describe("avg", () => {
  it("returns 0 when obj is falsy", () => {
    expect(avg(null, "value")).toBe(0);
  });

  it("returns 0 when key is falsy", () => {
    expect(avg({ a: { value: 1 } }, null)).toBe(0);
  });

  it("calculates average of a key across object values", () => {
    const obj = {
      a: { value: 2 },
      b: { value: 4 },
      c: { value: 6 },
    };
    expect(avg(obj, "value")).toBe(4);
  });
});

describe("abbreviateNumber", () => {
  it("does not abbreviate numbers < 1000", () => {
    expect(abbreviateNumber(500)).toBe("500");
  });

  it("abbreviates thousands", () => {
    expect(abbreviateNumber(1500)).toBe("1.50K");
  });

  it("abbreviates millions", () => {
    const res = abbreviateNumber(2_000_000);
    expect(res.endsWith("M")).toBe(true);
    expect(parseFloat(res.replace("M", ""))).toBeCloseTo(2, 3);
    expect(res).toBe("2.00M");
  });
});

describe("getDelegatorStatus", () => {
  const makeDelegator = (overrides = {}) =>
    ({
      bondedAmount: "0",
      unbondingLocks: [],
      startRound: "0",
      ...overrides,
    } as unknown as NonNullable<AccountQueryResult["data"]>["delegator"]);

  const makeRound = (id: string | undefined) =>
    (id ? { id } : undefined) as { __typename: "Round"; id: string };

  it("returns Unbonded when bondedAmount is 0 or falsy", () => {
    const delegator = makeDelegator({ bondedAmount: "0" });
    const currentRound = makeRound("100");
    expect(getDelegatorStatus(delegator, currentRound)).toBe("Unbonded");
  });

  it("returns Unbonding when there is an unbonding lock with withdrawRound > currentRound.id", () => {
    const delegator = makeDelegator({
      bondedAmount: "10",
      unbondingLocks: [
        { withdrawRound: "105" }, // > 100
      ],
    });
    const currentRound = makeRound("100");
    expect(getDelegatorStatus(delegator, currentRound)).toBe("Unbonding");
  });

  it("returns Pending when startRound > currentRound.id and not unbonding", () => {
    const delegator = makeDelegator({
      bondedAmount: "10",
      startRound: "110",
      unbondingLocks: [], // no future withdrawRound
    });
    const currentRound = makeRound("100");
    expect(getDelegatorStatus(delegator, currentRound)).toBe("Pending");
  });

  it("returns Bonded when startRound <= currentRound.id and > 0", () => {
    const delegator = makeDelegator({
      bondedAmount: "10",
      startRound: "90",
    });
    const currentRound = makeRound("100");
    expect(getDelegatorStatus(delegator, currentRound)).toBe("Bonded");
  });

  it("falls back to Unbonded otherwise", () => {
    const delegator = makeDelegator({
      bondedAmount: "10",
      startRound: "0",
      unbondingLocks: [],
    });
    const currentRound = makeRound("100");
    expect(getDelegatorStatus(delegator, currentRound)).toBe("Unbonded");
  });
});

describe("textTruncate", () => {
  it("returns original string if below length", () => {
    expect(textTruncate("hello", 10, "...")).toBe("hello");
  });

  it("truncates and appends ending", () => {
    expect(textTruncate("hello world", 8, "...")).toBe("hello...");
  });

  it("uses default length when length is null", () => {
    const res = textTruncate("x".repeat(200), null, "...");
    expect(res.length).toBe(100); // 97 chars + '...'
    expect(res.endsWith("...")).toBe(true);
  });

  it("uses default ending when ending is null", () => {
    const res = textTruncate("hello world", 8, null);
    expect(res).toBe("hello...");
  });
});

describe("checkAddressEquality", () => {
  it("returns false for invalid addresses", () => {
    expect(checkAddressEquality("not-an-address", "0x123")).toBe(false);
  });

  it("compares valid addresses case-insensitively", () => {
    const addrLower = "0x00a0000000000000000000000000000000000001";
    const addrUpper =
      "0x00a0000000000000000000000000000000000001".toUpperCase();
    expect(checkAddressEquality(addrLower, addrUpper)).toBe(true);
  });

  it("returns false for different valid addresses", () => {
    const addr1 = "0x0000000000000000000000000000000000000001";
    const addr2 = "0x0000000000000000000000000000000000000002";
    expect(checkAddressEquality(addr1, addr2)).toBe(false);
  });
});

describe("getHint", () => {
  const transcoders = [{ id: "0xA" }, { id: "0xB" }, { id: "0xC" }];

  it("returns default hint when no transcoders", () => {
    const hint = getHint("0xA", []);
    expect(hint).toEqual({
      newPosPrev: EMPTY_ADDRESS,
      newPosNext: EMPTY_ADDRESS,
    });
  });

  it("returns default hint when id is falsy", () => {
    const hint = getHint(null, transcoders);
    expect(hint).toEqual({
      newPosPrev: EMPTY_ADDRESS,
      newPosNext: EMPTY_ADDRESS,
    });
  });

  it("sets only newPosNext when index is 0", () => {
    const hint = getHint("0xA", transcoders);
    expect(hint).toEqual({
      newPosPrev: EMPTY_ADDRESS,
      newPosNext: "0xB",
    });
  });

  it("sets only newPosPrev when index is last", () => {
    const hint = getHint("0xC", transcoders);
    expect(hint).toEqual({
      newPosPrev: "0xB",
      newPosNext: EMPTY_ADDRESS,
    });
  });

  it("sets both prev and next when in the middle", () => {
    const hint = getHint("0xB", transcoders);
    expect(hint).toEqual({
      newPosPrev: "0xA",
      newPosNext: "0xC",
    });
  });

  it("returns default hint when transcoder not found or length < 2", () => {
    const hint = getHint("0xZ", transcoders);
    expect(hint).toEqual({
      newPosPrev: EMPTY_ADDRESS,
      newPosNext: EMPTY_ADDRESS,
    });

    const hintShort = getHint("0xA", [{ id: "0xA" }]);
    expect(hintShort).toEqual({
      newPosPrev: EMPTY_ADDRESS,
      newPosNext: EMPTY_ADDRESS,
    });
  });
});

describe("simulateNewActiveSetOrder", () => {
  const baseTranscoders = () =>
    [
      { id: "0xA", totalStake: "100" },
      { id: "0xB", totalStake: "200" },
      { id: "0xC", totalStake: "300" },
    ] as {
      __typename: "Transcoder";
      id: string;
      totalStake: string;
    }[];

  it("returns original array when newDelegate not found", () => {
    const transcoders = baseTranscoders();
    const result = simulateNewActiveSetOrder({
      action: "delegate",
      transcoders,
      amount: 50n,
      newDelegate: "0xZ",
      oldDelegate: EMPTY_ADDRESS,
    });
    expect(result).toEqual(transcoders);
  });

  it("increases totalStake for delegate action and reorders ascending", () => {
    const transcoders = baseTranscoders();
    const result = simulateNewActiveSetOrder({
      action: "delegate",
      transcoders,
      amount: 150n,
      newDelegate: "0xA",
      oldDelegate: EMPTY_ADDRESS,
    });

    // 0xA: 100 + 150 = 250
    const updatedA = result.find((t) => t.id === "0xA");
    expect(updatedA?.totalStake).toBe("250");

    // sorted ascending by totalStake
    const stakes = result.map((t) => Number(t.totalStake));
    expect(stakes).toEqual(stakes.slice().sort((a, b) => a - b));
  });

  it("moves stake from oldDelegate to newDelegate when delegator is moving stake", () => {
    const transcoders = baseTranscoders();
    const result = simulateNewActiveSetOrder({
      action: "delegate",
      transcoders,
      amount: 50n,
      newDelegate: "0xA",
      oldDelegate: "0xC",
    });

    const updatedA = result.find((t) => t.id === "0xA");
    const updatedC = result.find((t) => t.id === "0xC");

    expect(updatedA?.totalStake).toBe("150"); // 100 + 50
    expect(updatedC?.totalStake).toBe("250"); // 300 - 50
  });

  it("decreases totalStake for non-delegate action (e.g. unbond) and reorders", () => {
    const transcoders = baseTranscoders();
    const result = simulateNewActiveSetOrder({
      action: "unbond" as StakingAction,
      transcoders,
      amount: 50n,
      newDelegate: "0xB",
      oldDelegate: EMPTY_ADDRESS,
    });

    const updatedB = result.find((t) => t.id === "0xB");
    expect(updatedB?.totalStake).toBe("150");

    const stakes = result.map((t) => Number(t.totalStake));
    expect(stakes).toEqual(stakes.slice().sort((a, b) => a - b));
  });
});

describe("getPercentChange", () => {
  it("returns percent change between two values", () => {
    expect(getPercentChange("200", "100")).toBe(100);
    expect(getPercentChange("50", "100")).toBe(-50);
  });

  it("returns 0 when value24HoursAgo is 0 (division by zero)", () => {
    expect(getPercentChange("100", "0")).toBe(0);
  });

  it("returns 0 when values are not numbers", () => {
    expect(getPercentChange("foo", "bar")).toBe(0);
  });
});

describe("fromWei", () => {
  it("converts string wei to ether string", () => {
    const oneEthWei = "1000000000000000000";
    expect(fromWei(oneEthWei)).toBe("1");
  });

  it("converts bigint wei to ether string", () => {
    const twoEthWei = 2000000000000000000n;
    expect(fromWei(twoEthWei)).toBe("2");
  });
});

describe("toWei", () => {
  it("converts ether number to bigint wei", () => {
    expect(toWei(1)).toBe(1000000000000000000n);
    expect(toWei(0.5)).toBe(500000000000000000n);
  });
});

describe("isImageUrl", () => {
  it("returns true for common image extensions", () => {
    expect(isImageUrl("https://example.com/image.jpg")).toBe(true);
    expect(isImageUrl("https://example.com/image.JPEG")).toBe(true);
    expect(isImageUrl("https://example.com/image.png")).toBe(true);
    expect(isImageUrl("https://example.com/image.webp")).toBe(true);
  });

  it("returns false for non-image URLs", () => {
    expect(isImageUrl("https://example.com/index.html")).toBe(false);
    expect(isImageUrl("not-a-url")).toBe(false);
  });
});

describe("formatAddress", () => {
  it("shortens a normal ethereum address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    const shortened = formatAddress(addr);

    // Implementation: replace address.slice(5, 39) with "…"
    const expected = addr.slice(0, 6) + "…" + addr.slice(-4);

    expect(shortened).toBe(expected);
  });

  it("returns empty string for falsy address", () => {
    expect(formatAddress(null)).toBe("");
  });
});
