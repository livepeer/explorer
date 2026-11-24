import {
  exactLPT,
  formatLPT,
  formatToken,
  formatUSD,
  fromWei,
  toWei,
} from "./format";

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

describe("formatToken floor", () => {
  it("never shows more than is available", () => {
    expect(formatToken(0.50897, { floor: true })).toBe("0.5089");
    expect(formatToken(0.50897)).toBe("0.5090");
    expect(formatToken(1.15, { floor: true })).toBe("1.15");
    expect(formatToken(1.999, { floor: true })).toBe("1.99");
  });
});

describe("exactLPT", () => {
  const WEI = 10n ** 18n;

  it("shows every digit that rounding hid", () => {
    const wei = 152_374n * WEI + 19_283_746_501_928_374n;
    expect(exactLPT(wei, formatLPT(fromWei(wei)))).toBe(
      "152,374.019283746501928374 LPT"
    );
    expect(exactLPT(wei, formatLPT(fromWei(wei), { compact: true }))).toBe(
      "152,374.019283746501928374 LPT"
    );
    // The headline's number, without its unit.
    expect(exactLPT(wei, formatToken(fromWei(wei)))).toBe(
      "152,374.019283746501928374 LPT"
    );
    // A whole amount, abbreviated.
    expect(exactLPT(15_000n * WEI, formatLPT(15_000, { compact: true }))).toBe(
      "15,000 LPT"
    );
  });

  it("gives dust its digits, and drops trailing zeros", () => {
    expect(exactLPT(1n, formatLPT(fromWei(1n)))).toBe(
      "0.000000000000000001 LPT"
    );
    expect(exactLPT(1_234_500n * 10n ** 13n, "12.35 LPT")).toBe("12.345 LPT");
  });

  it("has nothing to add when the figure is already exact", () => {
    expect(exactLPT(15_000n * WEI, formatLPT(15_000))).toBeNull();
    expect(exactLPT(15n * 10n ** 17n, formatLPT(1.5))).toBeNull(); // "1.50"
    expect(exactLPT(0n, formatLPT(0))).toBeNull();
  });
});
