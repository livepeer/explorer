"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import {
  type EarningsAccount,
  earningsCsv,
  earningsRows,
} from "@/lib/portfolio/csv";
import { fetchRewardTimes } from "@/lib/subgraph/network";

type Prices = { lpt: (number | null)[]; eth: (number | null)[] };

/** Follow-up requests at most, after the first. */
const MAX_FOLLOW_UPS = 8;

/**
 * USD prices at each moment. The route reads a bounded number of pages per
 * request and stops at a time budget, keeping what it read; follow-up
 * requests fill in the rest, while each one still adds prices.
 */
async function pricesAt(times: number[]): Promise<Prices> {
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

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportEarnings({
  accounts,
  name,
}: {
  accounts: EarningsAccount[];
  /** Used in the file name, e.g. a wallet's label. */
  name: string;
}) {
  const [busy, setBusy] = useState(false);
  const empty = !accounts.some((a) =>
    a.series.some((p) => p.rewards > 0 || p.fees > 0)
  );

  const run = async () => {
    setBusy(true);
    // When each orchestrator called reward, to price rows at that moment.
    const orchestrators = [
      ...new Set(
        accounts.flatMap((a) =>
          a.series.flatMap((p) => (p.from ? [p.from.toLowerCase()] : []))
        )
      ),
    ];
    const rewardTimes = await fetchRewardTimes(orchestrators).catch(
      () => new Map<string, number>()
    );
    const rows = earningsRows(accounts, rewardTimes);
    let prices: Prices = { lpt: [], eth: [] };
    let priced = true;
    try {
      prices = await pricesAt(rows.map((r) => r.ts));
    } catch {
      priced = false;
    }
    // A row needs LPT's price only if it has rewards, ETH's only if it has
    // fees: count the rows missing a price they need, of either kind.
    const missing = rows.filter(
      ({ point: p }, i) =>
        (p.rewards > 0 && prices.lpt[i] == null) ||
        (p.fees > 0 && prices.eth[i] == null)
    ).length;
    const csv = earningsCsv(rows, prices);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    download(
      `livepeer-earnings-${slug || "portfolio"}-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
      csv
    );
    setBusy(false);
    if (!priced)
      toast.warning("Exported without USD values", {
        description: "Price history couldn't be loaded. Try again later.",
      });
    else if (missing > 0)
      toast.warning(`${missing} rows have no USD value`, {
        description: "No price was recorded near those times.",
      });
  };

  return (
    <Tooltip content="Download rewards and fees, round by round, with USD values at the time of each reward call">
      <Button
        variant="ghost"
        size="xs"
        onClick={run}
        disabled={busy || empty}
        aria-label="Export earnings as CSV"
      >
        {busy ? <Loader2 className="animate-spin" /> : <Download />} CSV
      </Button>
    </Tooltip>
  );
}
