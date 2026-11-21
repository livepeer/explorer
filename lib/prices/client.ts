/** Historical USD prices from the explorer's own route, for the browser. */

export type Prices = { lpt: (number | null)[]; eth: (number | null)[] };

/** Follow-up requests at most, after the first. */
const MAX_FOLLOW_UPS = 8;

/**
 * USD prices at each moment. The route reads a bounded number of pages per
 * request and stops at a time budget, keeping what it read; follow-up
 * requests fill in the rest, while each one still adds prices.
 */
export async function pricesAt(times: number[]): Promise<Prices> {
  const prices = await requestPrices(times);
  for (let i = 0; i < MAX_FOLLOW_UPS; i++) {
    const missing = times.filter(
      (_, j) => prices.lpt[j] == null || prices.eth[j] == null
    );
    if (!missing.length) break;
    const again = await requestPrices(missing).catch(() => null);
    if (!again) break;
    const at = new Map(missing.map((t, j) => [t, j]));
    let added = 0;
    times.forEach((t, j) => {
      const k = at.get(t);
      if (k == null) return;
      if (prices.lpt[j] == null && again.lpt[k] != null) {
        prices.lpt[j] = again.lpt[k];
        added++;
      }
      if (prices.eth[j] == null && again.eth[k] != null) {
        prices.eth[j] = again.eth[k];
        added++;
      }
    });
    // Nothing new: the rest have no price on record.
    if (!added) break;
  }
  return prices;
}

/** One request to the explorer's price-history route. */
async function requestPrices(times: number[]): Promise<Prices> {
  const unique = [...new Set(times)];
  const res = await fetch("/api/prices/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ times: unique }),
    signal: AbortSignal.timeout(70_000),
  });
  if (!res.ok) throw new Error(`Price history returned ${res.status}`);
  const json = (await res.json()) as Prices;
  const index = new Map(unique.map((t, i) => [t, i]));
  return {
    lpt: times.map((t) => json.lpt[index.get(t)!] ?? null),
    eth: times.map((t) => json.eth[index.get(t)!] ?? null),
  };
}
