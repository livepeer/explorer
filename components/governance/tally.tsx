import { cn } from "@/lib/cn";
import { formatLPT, formatPercent, formatToken } from "@/lib/format";
import type { Poll, TreasuryProposal } from "@/lib/subgraph/network";

export type TallySeries = {
  key: string;
  label: string;
  value: number;
  color: string;
};

export const proposalSeries = (p: TreasuryProposal): TallySeries[] => [
  { key: "for", label: "For", value: p.forVotes, color: "var(--series-3)" },
  {
    key: "against",
    label: "Against",
    value: p.againstVotes,
    color: "var(--series-2)",
  },
  {
    key: "abstain",
    label: "Abstain",
    value: p.abstainVotes,
    color: "var(--series-other)",
  },
];

export const pollSeries = (p: Poll): TallySeries[] => [
  { key: "yes", label: "Yes", value: p.yes, color: "var(--series-3)" },
  { key: "no", label: "No", value: p.no, color: "var(--series-2)" },
];

const total = (series: TallySeries[]) =>
  series.reduce((s, x) => s + Math.max(0, x.value), 0);

/** One stacked bar; 2px gaps separate segments. Empty tally = bare track. */
export function TallyBar({
  series,
  className,
}: {
  series: TallySeries[];
  className?: string;
}) {
  const sum = total(series);
  const label =
    sum > 0
      ? series
          .map((s) => `${s.label} ${formatPercent((s.value / sum) * 100)}`)
          .join(", ")
      : "No votes yet";
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "flex h-2 w-full gap-[2px] overflow-hidden rounded-[2px] bg-foreground/[0.06]",
        className
      )}
    >
      {sum > 0 &&
        series
          .filter((s) => s.value > 0)
          .map((s) => (
            <span
              key={s.key}
              className="h-full min-w-[2px]"
              style={{
                flexGrow: s.value,
                flexBasis: 0,
                backgroundColor: s.color,
              }}
            />
          ))}
    </div>
  );
}

export function Swatch({ color }: { color: string }) {
  return (
    <span
      aria-hidden="true"
      className="size-2 shrink-0 rounded-[2px]"
      style={{ backgroundColor: color }}
    />
  );
}

/** Swatch + label + value + share, one row per series. */
export function TallyLegend({
  series,
  unit = "LPT",
}: {
  series: TallySeries[];
  unit?: string;
}) {
  const sum = total(series);
  return (
    <dl className="flex flex-col gap-2">
      {series.map((s) => (
        <div key={s.key} className="flex items-center gap-2 text-ui-body">
          <Swatch color={s.color} />
          <dt className="text-muted-foreground">{s.label}</dt>
          <dd className="ml-auto flex items-baseline gap-3 font-mono text-[13px] tabular-nums">
            <span>
              {formatToken(s.value)}{" "}
              <span className="text-subtle-foreground">{unit}</span>
            </span>
            <span className="w-14 text-right text-muted-foreground">
              {sum > 0 ? formatPercent((s.value / sum) * 100) : "—"}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Inline key for lists of compact bars: swatch + label only. */
export function TallyKey({
  series,
}: {
  series: Pick<TallySeries, "key" | "label" | "color">[];
}) {
  return (
    <ul className="flex items-center gap-3 text-ui-caption text-muted-foreground">
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <Swatch color={s.color} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Turnout against quorum, under the tally: a vote that misses quorum fails
 * however lopsided it is, so it sits beside the result rather than in the
 * details. The bar fills as turnout approaches quorum.
 */
export function QuorumMeter({
  participation,
  quorum,
  toQuorum,
  ended,
}: {
  /** Share of the electorate that has voted, %. */
  participation: number;
  /** Share that must vote, %. */
  quorum: number;
  /** LPT still needed to reach quorum, when known. */
  toQuorum?: number | null;
  ended: boolean;
}) {
  const reached = participation >= quorum;
  const progress = quorum > 0 ? Math.min(1, participation / quorum) : 1;
  const status = reached
    ? "Quorum reached"
    : ended
    ? "Quorum not reached"
    : toQuorum != null && toQuorum > 0
    ? `${formatLPT(toQuorum, { compact: true })} more needed`
    : "Below quorum so far";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-ui-body">
        <span className="text-muted-foreground">Quorum</span>
        <span className="font-mono text-[13px] tabular-nums">
          {formatPercent(participation, { decimals: 2 })}
          <span className="text-subtle-foreground">
            {" "}
            / {formatPercent(quorum, { decimals: 2 })}
          </span>
        </span>
      </div>
      <div
        role="meter"
        aria-label="Turnout towards quorum"
        aria-valuemin={0}
        aria-valuemax={quorum}
        aria-valuenow={Math.min(participation, quorum)}
        aria-valuetext={`${formatPercent(participation, {
          decimals: 2,
        })} of ${formatPercent(quorum, { decimals: 2 })} quorum`}
        className="h-1.5 w-full overflow-hidden rounded-[2px] bg-foreground/[0.06]"
      >
        <span
          className={cn(
            "block h-full rounded-[2px]",
            reached
              ? "bg-green-bright"
              : // Light mode's warm is dark enough for text; a bar can be the
                // brighter amber dark mode shows.
                "bg-warm light:bg-[#f59e0b]"
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <span
        className={cn(
          "text-ui-caption",
          reached ? "text-green-bright" : "text-warm"
        )}
      >
        {status}
      </span>
    </div>
  );
}
