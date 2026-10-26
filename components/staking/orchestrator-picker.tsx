"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Identity, useEnsNames } from "@/components/identity";
import { Input } from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { rankByYield } from "@/lib/orchestrators/ranking";
import { searchRank } from "@/lib/search";
import type { Orchestrator } from "@/lib/subgraph/network";

/** The best few reliable ones, listed first. */
const SHORTLIST = 4;

const terms = (o: Orchestrator) =>
  [
    o.realizedApr != null && `${o.realizedApr.toFixed(1)}% APR`,
    `${o.rewardCut.toFixed(0)}% cut`,
    `${o.feeShare.toFixed(0)}% fee share`,
  ]
    .filter(Boolean)
    .join(" · ");

/** The shortlist's first pick: the best-yielding reliable orchestrator. */
export function recommendedOrchestrator(list: Orchestrator[] | undefined) {
  return shortlist(list ?? [])[0];
}

function shortlist(list: Orchestrator[]) {
  return rankByYield(
    list.filter((o) => o.rewardCalls >= o.rewardWindow)
  ).ranked.slice(0, SHORTLIST);
}

/**
 * Choose an orchestrator without leaving the dialog: every active one, the
 * best reliable ones first, scrolling inside the dialog, with a search by
 * name or address.
 */
export function OrchestratorPicker({
  orchestrators,
  value,
  onChange,
}: {
  orchestrators: Orchestrator[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const ids = useMemo(() => orchestrators.map((o) => o.id), [orchestrators]);
  const names = useEnsNames(ids, true);

  // Reliable ones first, best yield first, so the top rows are the ones
  // worth choosing; then the rest, in the Orchestrators page's order.
  const ordered = useMemo(() => {
    const top = shortlist(orchestrators);
    const { ranked, fresh } = rankByYield(orchestrators);
    return [...top, ...[...ranked, ...fresh].filter((o) => !top.includes(o))];
  }, [orchestrators]);
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => {
    if (q) {
      return ordered
        .map((o) => ({ o, rank: searchRank(o.id, names.get(o.id), q) }))
        .filter((r) => r.rank != null)
        .sort((a, b) => a.rank! - b.rank!)
        .map((r) => r.o);
    }
    return ordered;
  }, [q, ordered, names]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orchestrators by name or address"
          aria-label="Search orchestrators"
          className="h-8 pl-8"
        />
      </div>
      <div
        role="radiogroup"
        aria-label="Orchestrator"
        className={cn(
          // About four rows tall; the rest scroll, inside the dialog.
          "flex max-h-[232px] flex-col divide-y divide-(--hairline) overflow-y-auto rounded-lg border border-hairline"
        )}
      >
        {shown.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={o.id === value}
            onClick={() => onChange(o.id)}
            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-hover"
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full border",
                o.id === value ? "border-green-bright" : "border-border"
              )}
            >
              {o.id === value && (
                <span className="size-2 rounded-full bg-green-bright" />
              )}
            </span>
            <Identity
              address={o.id}
              href={null}
              size={22}
              secondary={terms(o)}
            />
          </button>
        ))}
        {shown.length === 0 && (
          <p className="px-3 py-4 text-center text-ui-caption text-muted-foreground">
            No active orchestrator matches &ldquo;{query.trim()}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
