import { formatFullLPT, getLptRewards } from "./lpt";

describe("formatFullLPT", () => {
  it.each([
    ["173779859.381234567890123456", "173,779,859.381234567890123456 LPT"],
    [
      "9007199254740993.000000000000000001",
      "9,007,199,254,740,993.000000000000000001 LPT",
    ],
    ["0.000000000000000001", "0.000000000000000001 LPT"],
    ["1.2345e-7", "0.00000012345 LPT"],
    ["1.234567890123456789e+20", "123,456,789,012,345,678,900 LPT"],
    ["-15000.123400", "-15,000.1234 LPT"],
    ["+00015.5000", "15.5 LPT"],
    [".5", "0.5 LPT"],
    ["-0.000", "0 LPT"],
    [0, "0 LPT"],
  ])("formats %s without rounding", (value, expected) => {
    expect(formatFullLPT(value)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "garbage",
    "Infinity",
    NaN,
    Infinity,
    "1e1001",
  ])("does not fabricate a full value for %s", (value) =>
    expect(formatFullLPT(value)).toBeNull()
  );

  it("preserves sign conventions without trailing zeros", () => {
    expect(formatFullLPT("15000.0100", { forceSign: true })).toBe(
      "+15,000.01 LPT"
    );
    expect(formatFullLPT("-15000.0100", { forceSign: true })).toBe(
      "-15,000.01 LPT"
    );
    expect(formatFullLPT("0", { forceSign: true })).toBe("0 LPT");
  });
});

describe("getLptRewards", () => {
  it("retains one wei of rewards on a large stake", () => {
    expect(getLptRewards("15000000000000000000001", "15000")).toBe(
      "0.000000000000000001"
    );
  });

  it("includes lifetime undelegations and subtracts principal precisely", () => {
    expect(
      getLptRewards("1000000000000000001", "2", "1.000000000000000002")
    ).toBe("0.000000000000000003");
  });

  it("handles scientific notation from the subgraph", () => {
    expect(getLptRewards("3", "1e-18", "1e-18")).toBe("0.000000000000000003");
  });

  it("leaves negative differences available for the caller's sign convention", () => {
    expect(getLptRewards("1000000000000000000", "2")).toBe("-1");
  });

  it("returns null until inputs are available and valid", () => {
    expect(getLptRewards(undefined, "1")).toBeNull();
    expect(getLptRewards("1", undefined)).toBeNull();
    expect(getLptRewards("bad", "1")).toBeNull();
    expect(getLptRewards("1", "bad")).toBeNull();
    expect(getLptRewards("0", "0")).toBe("0");
  });
});
