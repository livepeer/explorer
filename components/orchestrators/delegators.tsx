"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Identity, useEnsNames } from "@/components/identity";
import { Card, EmptyState } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/misc";
import { ShowAll } from "@/components/ui/show-all";
import { SortHeader } from "@/components/ui/sort-header";
import { formatLPT } from "@/lib/format";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";
import type { OrchestratorDetail } from "@/lib/subgraph/network";

const PAGE = 25;

type SortKey = "stake" | "since";

/**
 * Everyone delegated to an orchestrator: the top 25 by stake, then the rest
 * on request. Filter by address or ENS name; your own wallets are marked.
 */
export function OrchestratorDelegators({
  orchestrator,
  delegators,
  totalStake,
}: {
  orchestrator: string;
  delegators: OrchestratorDetail["delegatorList"];
  totalStake: number;
}) {
  const { inPortfolio } = usePortfolioAccounts();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("stake");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [showAll, setShowAll] = useState(false);

  const q = query.trim().toLowerCase();
  const addresses = useMemo(() => delegators.map((d) => d.id), [delegators]);
  const names = useEnsNames(addresses, q.length > 0);

  const rows = useMemo(() => {
    const matches = (id: string) =>
      !q || id.includes(q) || Boolean(names.get(id)?.includes(q));
    const key = (d: (typeof delegators)[number]) =>
      sort === "stake" ? d.bondedAmount : d.startRound;
    return delegators
      .filter((d) => matches(d.id))
      .sort((a, b) => (dir === "desc" ? key(b) - key(a) : key(a) - key(b)));
  }, [delegators, q, names, sort, dir]);

  const onSort = (k: SortKey) => {
    if (k === sort) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(k);
      setDir("desc");
    }
  };

  const visible = q || showAll ? rows : rows.slice(0, PAGE);

  return (
    <div className="flex flex-col gap-3">
      {delegators.length > PAGE && (
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by address or ENS name"
            aria-label="Filter delegators"
            className="pl-8"
          />
        </div>
      )}
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left">
          <thead>
            <tr className="border-b border-hairline text-ui-caption text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Delegator</th>
              <SortHeader
                label="Stake"
                k="stake"
                sort={sort}
                dir={dir}
                onSort={onSort}
                className="px-4"
              />
              <th className="px-4 py-2.5 text-right font-normal">Share</th>
              <SortHeader
                label="Since round"
                k="since"
                sort={sort}
                dir={dir}
                onSort={onSort}
                className="px-4"
              />
            </tr>
          </thead>
          <tbody>
            {visible.map((d) => (
              <tr
                key={d.id}
                className="border-b border-hairline last:border-0 hover:bg-hover/60"
              >
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-2">
                    <Identity
                      address={d.id}
                      size={22}
                      label={d.id === orchestrator ? "Self-stake" : undefined}
                    />
                    {inPortfolio(d.id) && <Badge tone="outline">You</Badge>}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] tabular-nums">
                  {formatLPT(d.bondedAmount)}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] text-muted-foreground tabular-nums">
                  {totalStake > 0
                    ? `${((d.bondedAmount / totalStake) * 100).toFixed(2)}%`
                    : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-[13px] text-muted-foreground tabular-nums">
                  {d.startRound.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {q && rows.length === 0 && (
          <EmptyState
            title="No matches"
            description={`No delegator matches “${query.trim()}”.`}
          />
        )}
        {!q && (
          <ShowAll
            shown={visible.length}
            total={rows.length}
            onMore={() => setShowAll(true)}
          />
        )}
      </Card>
    </div>
  );
}
