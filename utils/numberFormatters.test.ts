import {
  formatETH,
  formatLPT,
  formatNumber,
  formatPercent,
  formatRound,
  formatStakeAmount,
  formatUSD,
  formatVotingPower,
} from "./numberFormatters";

describe("formatLPT", () => {
  describe("zero handling", () => {
    it("formats zero as '0 LPT'", () => {
      expect(formatLPT(0)).toBe("0 LPT");
      expect(formatLPT("0")).toBe("0 LPT");
    });

    it("formats zero without symbol when showSymbol is false", () => {
      expect(formatLPT(0, { showSymbol: false })).toBe("0");
    });
  });

  describe("small value handling", () => {
    it("shows '< 0.01 LPT' for values below threshold", () => {
      expect(formatLPT(0.005)).toBe("< 0.01 LPT");
      expect(formatLPT(0.009)).toBe("< 0.01 LPT");
      expect(formatLPT(0.001)).toBe("< 0.01 LPT");
    });

    it("shows exact value for values at or above threshold", () => {
      expect(formatLPT(0.01)).toBe("0.01 LPT");
      expect(formatLPT(0.1)).toBe("0.1 LPT");
      expect(formatLPT(0.1)).toBe("0.1 LPT");
    });

    it("handles negative small values", () => {
      expect(formatLPT(-0.005)).toBe("> -0.01 LPT");
    });
  });

  describe("standard formatting", () => {
    it("formats with 2 decimal places by default, trimming zeros", () => {
      expect(formatLPT(1.5)).toBe("1.5 LPT");
      expect(formatLPT(123.456)).toBe("123.46 LPT");
      expect(formatLPT(1234.56789)).toBe("1,234.57 LPT");
    });

    it("includes thousand separators", () => {
      expect(formatLPT(1234.56)).toBe("1,234.56 LPT");
      expect(formatLPT(9999.99)).toBe("9,999.99 LPT");
    });

    it("handles negative values", () => {
      expect(formatLPT(-123.45)).toBe("-123.45 LPT");
      expect(formatLPT(-1234.56)).toBe("-1,234.56 LPT");
    });
  });

  describe("abbreviation (>= 10,000)", () => {
    it("does not abbreviate below 10,000", () => {
      expect(formatLPT(9999)).toBe("9,999 LPT");
      expect(formatLPT(9999.0)).toBe("9,999 LPT");
    });

    it("abbreviates at 10,000 and above", () => {
      expect(formatLPT(10000)).toBe("10K LPT");
      expect(formatLPT(15000)).toBe("15K LPT");
      expect(formatLPT(150000)).toBe("150K LPT");
    });

    it("uses m for millions", () => {
      expect(formatLPT(1500000)).toBe("1.5M LPT");
      expect(formatLPT(2000000)).toBe("2M LPT");
    });

    it("uses b for billions", () => {
      expect(formatLPT(1500000000)).toBe("1.5B LPT");
    });

    it("can disable abbreviation", () => {
      expect(formatLPT(15000, { abbreviate: false })).toBe("15,000 LPT");
    });
  });

  describe("null/undefined handling", () => {
    it("handles null as zero", () => {
      expect(formatLPT(null)).toBe("0 LPT");
    });

    it("handles undefined as zero", () => {
      expect(formatLPT(undefined)).toBe("0 LPT");
    });
  });

  describe("NaN handling", () => {
    it("handles NaN as zero", () => {
      expect(formatLPT(NaN)).toBe("0 LPT");
      expect(formatLPT("not a number")).toBe("0 LPT");
    });
  });

  describe("options", () => {
    it("respects showSymbol option", () => {
      expect(formatLPT(123.45, { showSymbol: false })).toBe("123.45");
      expect(formatLPT(15000, { showSymbol: false })).toBe("15K");
    });

    it("respects custom precision", () => {
      expect(formatLPT(123.456789, { precision: 4 })).toBe("123.4568 LPT");
    });

    it("respects thousandSeparated option", () => {
      expect(formatLPT(1234.56, { thousandSeparated: false })).toBe(
        "1234.56 LPT"
      );
    });

    it("respects trimZeros option", () => {
      expect(formatLPT(1.5, { trimZeros: false })).toBe("1.50 LPT");
      expect(formatLPT(100, { trimZeros: false })).toBe("100.00 LPT");
    });
  });

  describe("forceSign", () => {
    it("shows + for positive numbers", () => {
      expect(formatLPT(10, { forceSign: true })).toBe("+10 LPT");
    });

    it("shows - for negative numbers", () => {
      expect(formatLPT(-10, { forceSign: true })).toBe("-10 LPT");
    });
  });
});

describe("formatETH", () => {
  describe("zero handling", () => {
    it("formats zero as '0 ETH'", () => {
      expect(formatETH(0)).toBe("0 ETH");
      expect(formatETH("0")).toBe("0 ETH");
    });
  });

  describe("small value handling", () => {
    it("shows '< 0.0001 ETH' for values below threshold", () => {
      expect(formatETH(0.00005)).toBe("< 0.0001 ETH");
      expect(formatETH(0.00009)).toBe("< 0.0001 ETH");
    });

    it("shows exact value for values at or above threshold", () => {
      expect(formatETH(0.0001)).toBe("0.0001 ETH");
      expect(formatETH(0.001)).toBe("0.001 ETH");
    });
  });

  describe("standard formatting", () => {
    it("formats with 4 decimal places by default, trimming zeros", () => {
      expect(formatETH(1.23456789)).toBe("1.2346 ETH");
      expect(formatETH(100.5)).toBe("100.5 ETH");
    });

    it("includes thousand separators", () => {
      expect(formatETH(1234.5678)).toBe("1,234.5678 ETH");
    });
  });

  describe("abbreviation (>= 10,000)", () => {
    it("abbreviates when enabled", () => {
      expect(formatETH(15000, { abbreviate: true })).toBe("15K ETH");
      expect(formatETH(1500000, { abbreviate: true })).toBe("1.5M ETH");
    });

    it("does not abbreviate by default", () => {
      expect(formatETH(15000)).toBe("15,000 ETH");
    });

    it("forceSign works with abbreviation", () => {
      expect(formatETH(15000, { abbreviate: true, forceSign: true })).toBe(
        "+15K ETH"
      );
    });
  });

  describe("null/undefined handling", () => {
    it("handles null as zero", () => {
      expect(formatETH(null)).toBe("0 ETH");
    });

    it("handles undefined as zero", () => {
      expect(formatETH(undefined)).toBe("0 ETH");
    });
  });

  describe("forceSign", () => {
    it("shows + for positive numbers", () => {
      expect(formatETH(10, { forceSign: true })).toBe("+10 ETH");
    });
  });
});

describe("formatPercent", () => {
  describe("zero handling", () => {
    it("formats zero as '0%'", () => {
      expect(formatPercent(0)).toBe("0%");
      expect(formatPercent("0")).toBe("0%");
    });
  });

  describe("whole number percentages", () => {
    it("shows no decimals for whole numbers", () => {
      expect(formatPercent(0.5)).toBe("50%");
      expect(formatPercent(0.1)).toBe("10%");
      expect(formatPercent(1)).toBe("100%");
    });
  });

  describe("fractional percentages", () => {
    it("shows 2 decimals for fractional values", () => {
      expect(formatPercent(0.12345)).toBe("12.35%");
      expect(formatPercent(0.001)).toBe("0.10%");
      expect(formatPercent(0.5555)).toBe("55.55%");
    });

    it("respects explicit precision even if looks like whole number", () => {
      // 0.0000005 * 100 = 0.00005 (looks whole by heuristic but isn't)
      expect(formatPercent(0.0000005, { precision: 5 })).toBe("0.00005%");
      // 0.5 * 100 = 50 (is whole)
      expect(formatPercent(0.5, { precision: 2 })).toBe("50.00%");
    });
  });

  describe("null/undefined handling", () => {
    it("handles null as zero", () => {
      expect(formatPercent(null)).toBe("0%");
    });

    it("handles undefined as zero", () => {
      expect(formatPercent(undefined)).toBe("0%");
    });
  });

  describe("forceSign", () => {
    it("shows + for positive numbers", () => {
      expect(formatPercent(0.1, { forceSign: true })).toBe("+10%");
      expect(formatPercent(0.5, { forceSign: true })).toBe("+50%");
    });

    it("shows - for negative numbers", () => {
      expect(formatPercent(-0.1, { forceSign: true })).toBe("-10%");
    });
  });
});

describe("formatVotingPower", () => {
  it("formats voting power with LPT rules", () => {
    expect(formatVotingPower(0)).toBe("0 LPT");
    expect(formatVotingPower(0.005)).toBe("< 0.01 LPT");
    expect(formatVotingPower(1234.56)).toBe("1,234.56 LPT");
    expect(formatVotingPower(15000)).toBe("15K LPT");
  });

  it("fixes Issue #442 - zero displays as '0 LPT' not '0.000'", () => {
    expect(formatVotingPower(0)).toBe("0 LPT");
    expect(formatVotingPower("0")).toBe("0 LPT");
  });
});

describe("formatStakeAmount", () => {
  it("formats stake amounts with LPT rules", () => {
    expect(formatStakeAmount(1234.56)).toBe("1,234.56 LPT");
    expect(formatStakeAmount(15000)).toBe("15K LPT");
  });
});

describe("formatRound", () => {
  describe("standard formatting", () => {
    it("formats with # prefix and no decimals", () => {
      expect(formatRound(12345)).toBe("#12,345");
      expect(formatRound(100)).toBe("#100");
    });

    it("includes thousand separators", () => {
      expect(formatRound(1234567)).toBe("#1,234,567");
    });

    it("supports custom precision", () => {
      expect(formatRound(12345.67, { precision: 2 })).toBe("#12,345.67");
      expect(formatRound(12345.67)).toBe("#12,346");
    });
  });

  describe("zero handling", () => {
    it("formats zero as '#0'", () => {
      expect(formatRound(0)).toBe("#0");
    });
  });

  describe("null/undefined handling", () => {
    it("handles null as zero", () => {
      expect(formatRound(null)).toBe("#0");
    });

    it("handles undefined as zero", () => {
      expect(formatRound(undefined)).toBe("#0");
    });
  });
});

describe("formatNumber", () => {
  describe("zero handling", () => {
    it("formats zero as '0'", () => {
      expect(formatNumber(0)).toBe("0");
    });
  });

  describe("standard formatting", () => {
    it("formats with 2 decimal places by default", () => {
      expect(formatNumber(1234.56)).toBe("1,234.56");
      expect(formatNumber(123.456)).toBe("123.46");
    });

    it("respects custom precision", () => {
      expect(formatNumber(1234.56, { precision: 0 })).toBe("1,235");
      expect(formatNumber(1234.56789, { precision: 4 })).toBe("1,234.5679");
    });
  });

  describe("abbreviation", () => {
    it("does not abbreviate by default", () => {
      expect(formatNumber(15000)).toBe("15,000");
    });

    it("abbreviates when enabled", () => {
      expect(formatNumber(15000, { abbreviate: true })).toBe("15K");
      expect(formatNumber(1500000, { abbreviate: true })).toBe("1.5M");
    });

    it("only abbreviates at 10,000 threshold", () => {
      expect(formatNumber(9999, { abbreviate: true })).toBe("9,999");
      expect(formatNumber(10000, { abbreviate: true })).toBe("10K");
    });
  });

  describe("null/undefined handling", () => {
    it("handles null as zero", () => {
      expect(formatNumber(null)).toBe("0");
    });

    it("handles undefined as zero", () => {
      expect(formatNumber(undefined)).toBe("0");
    });
  });

  describe("forceSign", () => {
    it("shows + for positive numbers", () => {
      expect(formatNumber(10, { forceSign: true })).toBe("+10");
      expect(formatNumber(15000, { abbreviate: true, forceSign: true })).toBe(
        "+15K"
      );
    });

    it("shows - for negative numbers", () => {
      expect(formatNumber(-10, { forceSign: true })).toBe("-10");
    });
  });
});

describe("formatUSD", () => {
  it("formats number with $ prefix", () => {
    expect(formatUSD(1234.56)).toBe("$1,234.56");
  });

  it("respects options", () => {
    expect(formatUSD(15000, { abbreviate: true })).toBe("$15K");
    expect(formatUSD(1234.56, { precision: 0 })).toBe("$1,235");
  });

  it("handles zero/null", () => {
    expect(formatUSD(0)).toBe("$0");
    expect(formatUSD(null)).toBe("$0");
  });

  it("supports forceSign", () => {
    expect(formatUSD(10, { forceSign: true })).toBe("$+10");
  });
});
