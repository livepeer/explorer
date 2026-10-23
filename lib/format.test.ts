import { formatLPT, formatToken } from "./format";

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
