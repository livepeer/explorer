import { formatLPT, formatToken, formatUSD, fromWei, toWei } from "./format";

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

describe("fromWei", () => {
  it("matches the same amount typed in, so the full balance isn't too much", () => {
    // Random wei amounts: each must equal its exact decimal parsed, as
    // filling in Max does. Adding whole and fraction rounded twice and
    // fell a hair short for about 1 in 8 of these.
    let seed = 7;
    const next = () => (seed = (seed * 16807) % 2147483647);
    for (let i = 0; i < 2000; i++) {
      const wei = BigInt(next()) * 10n ** 9n + BigInt(next());
      const exact = `${wei / 10n ** 18n}.${(wei % 10n ** 18n)
        .toString()
        .padStart(18, "0")}`;
      expect(fromWei(wei)).toBe(Number(exact));
      expect(toWei(exact)).toBe(wei);
    }
  });

  it("keeps whole amounts and negatives", () => {
    expect(fromWei(5n * 10n ** 18n)).toBe(5);
    expect(fromWei(-15n * 10n ** 17n)).toBe(-1.5);
    expect(fromWei(0n)).toBe(0);
  });
});
