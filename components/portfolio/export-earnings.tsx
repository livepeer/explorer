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
import { type Prices, pricesAt } from "@/lib/prices/client";
import { fetchRewardTimes } from "@/lib/subgraph/network";

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
        {busy ? <Loader2 className="animate-spin" /> : <Download />}
        {/* The icon alone on a phone. */}
        <span className="hidden sm:inline">CSV</span>
      </Button>
    </Tooltip>
  );
}
