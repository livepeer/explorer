import { formatLPT, formatToken, formatUSD } from "./format";

describe("formatToken", () => {
  it("names amounts too small to show, instead of rounding them to zero", () => {
    expect(formatToken(0.0000312)).toBe("<0.0001");
    expect(formatLPT(0.0000312)).toBe("<0.0001 LPT");
    expect(formatToken(-0.00001)).toBe("-<0.0001");
  });

  it("keeps zero and visible amounts as they were", () => {
    expect(formatToken(0)).toBe("0");
    expect(formatToken(0.00005)).toBe("0.0001");
    expect(formatToken(0.6386)).toBe("0.6386");
    expect(formatLPT(1850)).toBe("1,850 LPT");
  });
});

describe("formatUSD", () => {
  it("keeps a decimal on compact millions, not on thousands", () => {
    expect(formatUSD(1_363_000, { compact: true })).toBe("$1.4M");
    expect(formatUSD(621_400, { compact: true })).toBe("$621K");
    expect(formatUSD(25_930, { compact: true })).toBe("$25,930");
    expect(formatUSD(12.345)).toBe("$12.35");
  });
});
