import { zeroAddress } from "viem";

import { bondHints, simulateHint } from "./hints";

const set = [
  { id: "0xa", stake: 300 },
  { id: "0xb", stake: 200 },
  { id: "0xc", stake: 100 },
];

describe("simulateHint", () => {
  it("returns neighbours in descending-stake order", () => {
    expect(simulateHint(set, "0xb", {})).toEqual({ prev: "0xa", next: "0xc" });
  });

  it("re-sorts after the stake change", () => {
    expect(simulateHint(set, "0xc", { "0xc": 150 })).toEqual({
      prev: "0xa",
      next: "0xb",
    });
    expect(simulateHint(set, "0xc", { "0xc": 500 })).toEqual({
      prev: zeroAddress,
      next: "0xa",
    });
  });

  it("returns empty hints for an orchestrator outside the active set", () => {
    expect(simulateHint(set, "0xd", {})).toEqual({
      prev: zeroAddress,
      next: zeroAddress,
    });
  });
});

describe("bondHints", () => {
  it("moves stake from the old delegate to the new one", () => {
    const hints = bondHints(set, {
      to: "0xc",
      from: "0xa",
      amount: 0,
      moved: 250,
    });
    // a: 50, b: 200, c: 350
    expect(hints.newDelegate).toEqual({ prev: zeroAddress, next: "0xb" });
    expect(hints.oldDelegate).toEqual({ prev: "0xb", next: zeroAddress });
  });

  it("only touches the target when adding to the same delegate", () => {
    const hints = bondHints(set, {
      to: "0xb",
      from: "0xb",
      amount: 150,
      moved: 999,
    });
    // b: 350 overtakes a
    expect(hints.newDelegate).toEqual({ prev: zeroAddress, next: "0xa" });
    expect(hints.oldDelegate).toEqual({ prev: zeroAddress, next: zeroAddress });
  });
});
