import numbro from "numbro";

/**
 * Formatting options for number formatters
 */
export interface FormatOptions {
  /** Whether to show the currency/unit symbol (e.g., "LPT", "ETH") */
  showSymbol?: boolean;
  /** Whether to use K/M/B/T abbreviations for large numbers */
  abbreviate?: boolean;
  /** Number of decimal places to show */
  precision?: number;
  /** Whether to show thousand separators (commas) */
  thousandSeparated?: boolean;
  /** Whether to trim trailing zeros (e.g. 1.5 instead of 1.50). Default is true (cleaner output). */
  trimZeros?: boolean;
}

/**
 * Format LPT token amounts with consistent rules:
 * - 2 decimal places by default
 * - Show "< 0.01 LPT" for values below 0.01
 * - Use K/M/B/T abbreviations for values >= 10,000
 * - Show "0 LPT" for zero (not "0.00 LPT")
 *
 * @remarks
 * **PREFER using domain-specific wrappers** (e.g. `formatVotingPower`, `formatStakeAmount`)
 * when possible. Only use this generic function if no specific wrapper exists for your use case.
 *
 * @param value - The LPT amount to format (number or string)
 * @param options - Optional formatting configuration
 * @returns Formatted string (e.g., "1,234.56 LPT", "15K LPT", "< 0.01 LPT")
 *
 * @example
 * formatLPT(0)                    // "0 LPT"
 * formatLPT(0.005)                // "< 0.01 LPT"
 * formatLPT(1234.56)              // "1,234.56 LPT"
 * formatLPT(15000)                // "15K LPT"
 * formatLPT(1.5, { trimZeros: false }) // "1.50 LPT"
 */
export function formatLPT(
  value: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  const {
    showSymbol = true,
    abbreviate = true,
    precision = 2,
    thousandSeparated = true,
    trimZeros = true,
  } = options;

  // Handle null/undefined
  if (value == null) {
    return showSymbol ? "0 LPT" : "0";
  }

  const num = Number(value);

  // Handle NaN
  if (isNaN(num)) {
    return showSymbol ? "0 LPT" : "0";
  }

  // Handle zero explicitly
  if (num === 0) {
    return showSymbol ? "0 LPT" : "0";
  }

  // Handle very small positive values
  const threshold = Math.pow(10, -precision);
  if (num > 0 && num < threshold) {
    const thresholdStr = threshold.toFixed(precision);
    return showSymbol ? `< ${thresholdStr} LPT` : `< ${thresholdStr}`;
  }

  // Handle negative small values (show as negative threshold)
  if (num < 0 && num > -threshold) {
    const thresholdStr = threshold.toFixed(precision);
    return showSymbol ? `> -${thresholdStr} LPT` : `> -${thresholdStr}`;
  }

  let formatted: string;

  // Use abbreviations for large numbers (>= 10,000)
  if (abbreviate && Math.abs(num) >= 10000) {
    formatted = numbro(num)
      .format({
        average: true,
        mantissa: 2,
        trimMantissa: true,
        thousandSeparated: false,
      })
      .toUpperCase();
  } else {
    // Standard formatting with specified precision
    formatted = numbro(num).format({
      thousandSeparated,
      mantissa: precision,
      trimMantissa: trimZeros,
    });
  }

  return showSymbol ? `${formatted} LPT` : formatted;
}

/**
 * Format ETH amounts with consistent rules:
 * - 4 decimal places by default
 * - Show "< 0.0001 ETH" for values below 0.0001
 * - No abbreviations (ETH amounts typically don't get that large)
 * - Show "0 ETH" for zero
 *
 * @param value - The ETH amount to format (number or string)
 * @param options - Optional formatting configuration
 * @returns Formatted string (e.g., "1.2346 ETH", "< 0.0001 ETH")
 *
 * @example
 * formatETH(0)                    // "0 ETH"
 * formatETH(0.00005)              // "< 0.0001 ETH"
 * formatETH(1.23456789)           // "1.2346 ETH"
 * formatETH(100.5)                // "100.5 ETH"
 */
export function formatETH(
  value: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  const {
    showSymbol = true,
    precision = 4,
    thousandSeparated = true,
    trimZeros = true,
  } = options;

  // Handle null/undefined
  if (value == null) {
    return showSymbol ? "0 ETH" : "0";
  }

  const num = Number(value);

  // Handle NaN
  if (isNaN(num)) {
    return showSymbol ? "0 ETH" : "0";
  }

  // Handle zero explicitly
  if (num === 0) {
    return showSymbol ? "0 ETH" : "0";
  }

  // Handle very small positive values
  const threshold = Math.pow(10, -precision);
  if (num > 0 && num < threshold) {
    const thresholdStr = threshold.toFixed(precision);
    return showSymbol ? `< ${thresholdStr} ETH` : `< ${thresholdStr}`;
  }

  // Handle negative small values
  if (num < 0 && num > -threshold) {
    const thresholdStr = threshold.toFixed(precision);
    return showSymbol ? `> -${thresholdStr} ETH` : `> -${thresholdStr}`;
  }

  // Standard formatting (no abbreviations for ETH)
  const formatted = numbro(num).format({
    thousandSeparated,
    mantissa: precision,
    trimMantissa: trimZeros,
  });

  return showSymbol ? `${formatted} ETH` : formatted;
}

/**
 * Format percentage values with consistent rules:
 * - 2 decimal places for fractional percentages
 * - 0 decimal places for whole number percentages
 * - Always show % symbol
 *
 * @param value - The percentage as a decimal (0.5 = 50%)
 * @param options - Optional formatting configuration
 * @returns Formatted string (e.g., "50%", "12.35%")
 *
 * @example
 * formatPercent(0.5)              // "50%"
 * formatPercent(0.12345)          // "12.35%"
 * formatPercent(0.1)              // "10%"
 * formatPercent(0.001)            // "0.10%"
 */
export function formatPercent(
  value: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  const { precision = 2 } = options;

  // Handle null/undefined
  if (value == null) {
    return "0%";
  }

  const num = Number(value);

  // Handle NaN
  if (isNaN(num)) {
    return "0%";
  }

  // Handle zero
  if (num === 0) {
    return "0%";
  }

  // Determine if we need decimals
  const percentValue = num * 100;
  const isWholeNumber = Math.abs(percentValue % 1) < 0.001; // Account for floating point

  const formatted = numbro(num).format({
    output: "percent",
    mantissa: isWholeNumber ? 0 : precision,
    trimMantissa: false, // Percentages should keep alignment usually
  });

  return formatted;
}

/**
 * Format voting power (specialized LPT formatter for voting contexts)
 * Uses the same rules as formatLPT but optimized for voting displays
 *
 * @remarks
 * **ALWAYS use this function** for voting power displays to ensure consistency across the app.
 * Enforces standard rules: 2 decimals, abbreviation at 10k.
 *
 * @param value - The voting power amount
 * @returns Formatted string (e.g., "1,234.56 LPT", "0 LPT")
 *
 * @example
 * formatVotingPower(0)            // "0 LPT" (fixes Issue #442)
 * formatVotingPower(1234.56)      // "1,234.56 LPT"
 * formatVotingPower(15000)        // "15k LPT"
 */
export function formatVotingPower(
  value: number | string | null | undefined
): string {
  return formatLPT(value, { precision: 2, abbreviate: true });
}

/**
 * Format stake amounts (specialized LPT formatter for staking contexts)
 *
 * @remarks
 * **ALWAYS use this function** for staking displays (delegations, active stake, etc.).
 * Enforces standard rules: 2 decimals, abbreviation at 10k.
 *
 * @param value - The stake amount
 * @returns Formatted string
 */
export function formatStakeAmount(
  value: number | string | null | undefined
): string {
  return formatLPT(value, { precision: 2, abbreviate: true });
}

/**
 * Format round numbers with consistent rules:
 * - No decimal places
 * - Thousand separators
 * - Prefix with #
 *
 * @param value - The round number
 * @returns Formatted string (e.g., "#12,345")
 *
 * @example
 * formatRound(12345)              // "#12,345"
 * formatRound(100)                // "#100"
 */
export function formatRound(value: number | string | null | undefined): string {
  // Handle null/undefined
  if (value == null) {
    return "#0";
  }

  const num = Number(value);

  // Handle NaN
  if (isNaN(num)) {
    return "#0";
  }

  const formatted = numbro(num).format({
    thousandSeparated: true,
    mantissa: 0,
  });

  return `#${formatted}`;
}

/**
 * Generic number formatter with flexible options
 *
 * @remarks
 * **AVOID** using this directly for token amounts. Use `formatLPT` or `formatETH` instead.
 * Use this for generic counters, stats, or non-currency values.
 *
 * @param value - The number to format
 * @param options - Formatting options
 * @returns Formatted string
 *
 * @example
 * formatNumber(1234.56)                           // "1,234.56"
 * formatNumber(1234.56, { precision: 0 })         // "1,235"
 * formatNumber(15000, { abbreviate: true })       // "15K"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options: FormatOptions = {}
): string {
  const {
    precision = 2,
    abbreviate = false,
    thousandSeparated = true,
    trimZeros = true,
  } = options;

  // Handle null/undefined
  if (value == null) {
    return "0";
  }

  const num = Number(value);

  // Handle NaN
  if (isNaN(num)) {
    return "0";
  }

  // Handle zero
  if (num === 0) {
    return "0";
  }

  // Use abbreviations for large numbers if requested
  if (abbreviate && Math.abs(num) >= 10000) {
    return numbro(num)
      .format({
        average: true,
        mantissa: 2,
        trimMantissa: true,
        thousandSeparated: false,
      })
      .toUpperCase();
  }

  // Standard formatting
  return numbro(num).format({
    thousandSeparated,
    mantissa: precision,
    trimMantissa: trimZeros,
  });
}
