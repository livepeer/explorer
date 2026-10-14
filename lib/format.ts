/**
 * Display formatting. Sans for language, mono for quantity: callers render
 * these strings inside `font-mono tabular-nums` where they sit in columns.
 */

const WEI = 10n ** 18n;

/** Wei (bigint) → float in whole tokens. Safe for display, not for math. */
export function fromWei(wei: bigint): number {
  const whole = wei / WEI;
  const frac = wei % WEI;
  return Number(whole) + Number(frac) / 1e18;
}

export function toWei(amount: string): bigint {
  const [whole = "0", frac = ""] = amount.trim().split(".");
  const padded = (frac + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * WEI + BigInt(padded || "0");
}

/** BigDecimal string from the subgraph ("123.45") → wei. */
export function decimalToWei(value: string | null | undefined): bigint {
  if (!value) return 0n;
  const negative = value.startsWith("-");
  const wei = toWei(negative ? value.slice(1) : value);
  return negative ? -wei : wei;
}

export function formatNumber(
  value: number,
  {
    decimals = 2,
    compact = false,
  }: { decimals?: number; compact?: boolean } = {}
): string {
  if (!Number.isFinite(value)) return "—";
  if (compact && Math.abs(value) >= 10_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Adaptive precision: big balances lose their cents, dust keeps its digits. */
export function formatToken(value: number, opts: { compact?: boolean } = {}) {
  const abs = Math.abs(value);
  const decimals = abs === 0 ? 0 : abs >= 1000 ? 0 : abs >= 1 ? 2 : 4;
  return formatNumber(value, { decimals, compact: opts.compact });
}

export function formatLPT(value: number, opts: { compact?: boolean } = {}) {
  return `${formatToken(value, opts)} LPT`;
}

export function formatETH(value: number) {
  const abs = Math.abs(value);
  const decimals =
    abs === 0
      ? 0
      : abs >= 1000
      ? 0
      : abs >= 100
      ? 2
      : abs >= 1
      ? 3
      : abs >= 0.001
      ? 4
      : 6;
  return `${formatNumber(value, { decimals })} ETH`;
}

export function formatUSD(value: number, opts: { compact?: boolean } = {}) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation:
      opts.compact && Math.abs(value) >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
  }).format(value);
}

export function formatPercent(
  value: number,
  { decimals = 1, signed = false }: { decimals?: number; signed?: boolean } = {}
) {
  if (!Number.isFinite(value)) return "—";
  const sign = signed && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatSigned(value: number, formatter: (n: number) => string) {
  if (value > 0) return `+${formatter(value)}`;
  if (value < 0) return `−${formatter(-value)}`;
  return formatter(0);
}

export function shortAddress(address: string, head = 6, tail = 4) {
  if (!address) return "";
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** "13h 24m" / "42m 18s" / "37s". Seconds only appear under an hour. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelativeTime(timestampSec: number, nowMs = Date.now()) {
  const diff = timestampSec - nowMs / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 86400 * 365)
    return rtf.format(Math.round(diff / 86400 / 30), "month");
  return rtf.format(Math.round(diff / 86400 / 365), "year");
}

export function formatDate(
  timestampSec: number,
  opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
) {
  return new Date(timestampSec * 1000).toLocaleDateString("en-US", opts);
}

/** Protocol percentages: rewardCut/feeShare are parts-per-million. */
export const PPM = 1_000_000;
export const ppmToPercent = (ppm: string | number) => (Number(ppm) / PPM) * 100;
