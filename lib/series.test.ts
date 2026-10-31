import { settledFrom } from "./series";

describe("settledFrom", () => {
  it("skips a placeholder and migration jumps", () => {
    // Arbitrum's first days: a placeholder supply, then LPT arriving.
    expect(
      settledFrom([1e-12, 12_882_545, 12_885_921, 24_926_848, 24_937_496])
    ).toBe(3);
  });

  it("ignores changes after the settling-in period", () => {
    const steady = Array.from({ length: 40 }, () => 100);
    steady[35] = 200;
    expect(settledFrom(steady)).toBe(0);
  });

  it("starts at the first day of a steady series", () => {
    expect(settledFrom([100, 100.5, 101])).toBe(0);
  });
});
