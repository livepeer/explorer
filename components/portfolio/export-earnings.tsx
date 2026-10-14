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

/**
 * USD prices at each moment. The route stops at a time budget on a cold
 * cache, keeping what it read; one more request fills in the rest.
 */
async function pricesAt(times: number[]): Promise<Prices> {
  const first = await requestPrices(times);
  const missing = times.filter(
    (_, i) => first.lpt[i] == null || first.eth[i] == null
  );
  if (!missing.length) return first;
  const again = await requestPrices(missing).catch(() => null);
  if (!again) return first;
  const at = new Map(missing.map((t, i) => [t, i]));
  const pick = (prev: number | null, next: (number | null)[], t: number) =>
    prev ?? (at.has(t) ? next[at.get(t)!] ?? null : null);
  return {
    lpt: times.map((t, i) => pick(first.lpt[i], again.lpt, t)),
    eth: times.map((t, i) => pick(first.eth[i], again.eth, t)),
  };
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
    const missing = prices.lpt.filter((p) => p == null).length;
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
