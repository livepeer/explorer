import type { SeriesPoint } from "./compute";

/**
 * Earnings, one row per wallet per round with anything earned: LPT rewards
 * (and the commission part of them), ETH fees, and their USD value at the
 * time. For taxes and bookkeeping, so values are plain decimals, times are
 * UTC, and a missing price is left blank rather than guessed.
 *
 * A row's time is when its orchestrator called reward that round, the
 * moment the LPT was minted. A round with fees but no reward call falls
 * back to the round's start; fees accrue across the round as tickets are
 * redeemed, so there's no single moment for them.
 */

export type EarningsAccount = {
  address: string;
  label?: string;
  series: SeriesPoint[];
};

export type EarningsRow = {
  account: EarningsAccount;
  point: SeriesPoint;
  /** Unix seconds the row is priced at. */
  ts: number;
  basis: "Reward call" | "Round start";
};

/** Rows with earnings, oldest first, timed by reward call where known. */
export function earningsRows(
  accounts: EarningsAccount[],
  /** Reward-call time by `${orchestrator}:${round}`. */
  rewardTimes: Map<string, number>
): EarningsRow[] {
  const rows = accounts.flatMap((account) =>
    account.series
      .filter((p) => p.rewards > 0 || p.fees > 0)
      .map((point): EarningsRow => {
        const called = point.from
          ? rewardTimes.get(`${point.from.toLowerCase()}:${point.round}`)
          : undefined;
        return called != null
          ? { account, point, ts: called, basis: "Reward call" }
          : { account, point, ts: point.ts, basis: "Round start" };
      })
  );
  return rows.sort(
    (x, y) =>
      x.point.round - y.point.round ||
      x.account.address.localeCompare(y.account.address)
  );
}

const HEADER = [
  "Time (UTC)",
  "Time basis",
  "Round",
  "Wallet",
  "Label",
  "Orchestrator",
  "Rewards (LPT)",
  "Commission (LPT)",
  "Fees (ETH)",
  "LPT price (USD)",
  "ETH price (USD)",
  "Rewards (USD)",
  "Fees (USD)",
  "Stake after round (LPT)",
];

const num = (n: number, decimals: number) =>
  n
    .toFixed(decimals)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");

/**
 * A text cell: labels, names and addresses, some from reverse ENS, which
 * anyone can set. Anything a spreadsheet could read as a formula (leading
 * = + - @, tab or a line break) gets a leading apostrophe, with no exemption
 * for things that look numeric: `-1+WEBSERVICE(...)` is a formula too.
 */
export function text(value: string) {
  if (/^[=+\-@\t\r\n]/.test(value)) value = `'${value}`;
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function earningsCsv(
  rows: EarningsRow[],
  /** USD prices aligned with `rows`; null or missing where unknown. */
  prices: { lpt: (number | null)[]; eth: (number | null)[] }
) {
  const lines = rows.map(({ account, point: p, ts, basis }, i) => {
    const lpt = prices.lpt[i] ?? null;
    const eth = prices.eth[i] ?? null;
    // Numbers are written by num() and pass through as numbers; every
    // text value goes through text().
    return [
      new Date(ts * 1000).toISOString().replace(/\.\d{3}Z$/, "Z"),
      text(basis),
      String(p.round),
      text(account.address),
      text(account.label ?? ""),
      text(p.from ?? ""),
      num(p.rewards, 10),
      num(p.commission, 10),
      num(p.fees, 10),
      lpt != null ? num(lpt, 6) : "",
      eth != null ? num(eth, 2) : "",
      lpt != null ? num(p.rewards * lpt, 2) : "",
      eth != null ? num(p.fees * eth, 2) : "",
      num(p.stake, 10),
    ].join(",");
  });
  return [HEADER.join(","), ...lines].join("\n") + "\n";
}
