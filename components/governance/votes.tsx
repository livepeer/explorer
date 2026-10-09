"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ExternalLink,
  Search,
  Users,
  Vote,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Avatar, useEnsNames, useIdentity } from "@/components/identity";
import { Card, EmptyState, ErrorNotice } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { Input, Segmented, Skeleton } from "@/components/ui/misc";
import { ShowAll } from "@/components/ui/show-all";
import { cn } from "@/lib/cn";
import { txUrl } from "@/lib/config";
import { formatLPT, formatPercent, formatRelativeTime } from "@/lib/format";
import { useElectorate, useOrchestrators } from "@/lib/hooks/queries";
import type { CastVote, Electorate, VoteChoice } from "@/lib/subgraph/votes";

import { useUrlParam } from "./detail";
import type { TallySeries } from "./tally";

const PAGE = 25;

/**
 * The active set a vote is measured against. `at` names the snapshot round
 * (or the L1 block a poll ended at); null means the vote is measured against
 * today's set. Falls back to today's set, flagged, if the round isn't indexed.
 */
export function useVoteElectorate(
  at: { round?: number; block?: number } | null
): Electorate | undefined {
  const snapshot = useElectorate(at);
  const orchestrators = useOrchestrators();
  const today = useMemo<Electorate | undefined>(
    () =>
      orchestrators.data
        ? {
            round: null,
            orchestrators: orchestrators.data
              .filter((o) => o.active)
              .map((o) => ({ id: o.id, totalStake: o.totalStake }))
              .sort((a, b) => b.totalStake - a.totalStake),
          }
        : undefined,
    [orchestrators.data]
  );
  if (!at) return today;
  if (snapshot.data) return snapshot.data;
  if (snapshot.isPending) return undefined;
  return today && { ...today, fallback: true };
}

type List = "voted" | "not-voted";
type SortKey = "weight" | "choice" | "time";
type Sort = { key: SortKey; dir: "asc" | "desc" };

// Chevron | voter | vote | weight | when. On phones: chevron | voter | vote,
// with weight and time folded under the name.
const VOTED_GRID =
  "grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-3 px-4 sm:grid-cols-[16px_minmax(0,1fr)_80px_148px_96px]";
const NOT_VOTED_GRID =
  "grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-x-3 px-4";

const pct = (share: number) =>
  formatPercent(share, { decimals: share < 1 ? 2 : 1 });

/* ── Cells ───────────────────────────────────────────────────────────────── */

function ChoiceLabel({
  choice,
  series,
}: {
  choice: VoteChoice;
  series: TallySeries[];
}) {
  const s = series.find((x) => x.key === choice);
  return (
    <span className="inline-flex items-center gap-1.5 text-ui-body">
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ background: s?.color }}
      />
      {s?.label ?? choice}
    </span>
  );
}

/** "790.9K LPT  10.0%" on one line. */
function Weight({ weight, share }: { weight: number; share?: number }) {
  return (
    <span className="font-mono text-[13px] whitespace-nowrap tabular-nums">
      {formatLPT(weight, { compact: true })}
      {share != null && (
        <span className="ml-2 inline-block w-12 text-right text-[11.5px] text-muted-foreground">
          {pct(share)}
        </span>
      )}
    </span>
  );
}

function When({ vote, nowMs }: { vote: CastVote; nowMs: number }) {
  if (!vote.timestamp) return <>—</>;
  const label = formatRelativeTime(vote.timestamp, nowMs);
  if (!vote.tx) return <>{label}</>;
  return (
    <a
      href={txUrl(vote.tx)}
      target="_blank"
      rel="noreferrer"
      title={`${new Date(
        vote.timestamp * 1000
      ).toLocaleString()} · view transaction`}
      className="group/when inline-flex items-center gap-1 whitespace-nowrap underline-offset-4 hover:text-foreground hover:underline"
    >
      {label}
      <ExternalLink className="size-3 opacity-0 transition-opacity group-hover/when:opacity-100 group-focus-visible/when:opacity-100" />
    </a>
  );
}

function Reason({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180;
  return (
    <blockquote className="col-start-2 col-end-[-1] mt-1.5 border-l-2 border-hairline pl-3 text-ui-caption whitespace-pre-line text-muted-foreground">
      <span className={cn(!open && long && "line-clamp-2")}>{text}</span>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="mt-0.5 block cursor-pointer text-foreground hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </blockquote>
  );
}

/** Avatar and name on one line, linking to the account or orchestrator. */
function VoterName({
  address,
  href,
  size = 22,
  children,
}: {
  address: string;
  href: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const { name, avatar, display } = useIdentity(address);
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Link
        href={href}
        title={address}
        className="-m-1 flex min-w-0 items-center gap-2.5 rounded-sm p-1 outline-none hover:underline focus-visible:ring-1 focus-visible:ring-green-bright/40"
        style={{ textUnderlineOffset: 4 }}
      >
        <Avatar address={address} src={avatar} size={size} />
        <span
          className={cn(
            "truncate text-ui-body text-foreground",
            !name && "font-mono text-[13px] tracking-tight"
          )}
        >
          {display}
        </span>
      </Link>
      {children}
    </span>
  );
}

/** "via vitalik.eth": whose vote a delegator replaced. */
function Via({ address }: { address: string }) {
  const { display } = useIdentity(address);
  return (
    <span className="truncate text-ui-caption text-muted-foreground">
      via {display}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-[4px] border border-hairline px-1 text-[10.5px] leading-4 text-muted-foreground">
      {children}
    </span>
  );
}

/**
 * Expand control for an orchestrator's delegators who voted themselves:
 * a neutral count, plus an amber note only for those who voted differently.
 */
function GroupSummary({
  votes: children,
  parentChoice,
  series,
  open,
  onToggle,
}: {
  votes: CastVote[];
  parentChoice?: VoteChoice;
  series: TallySeries[];
  open: boolean;
  onToggle: () => void;
}) {
  const differing = parentChoice
    ? series
        .map((s) => ({
          label: s.label,
          n: children.filter(
            (c) => c.choice === s.key && c.choice !== parentChoice
          ).length,
        }))
        .filter((x) => x.n > 0)
    : [];
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onToggle}
      title={`${children.length} delegator${
        children.length === 1 ? "" : "s"
      } voted their own stake`}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-sm text-ui-caption whitespace-nowrap text-muted-foreground hover:text-foreground"
    >
      <span className="rounded-full bg-hover px-1.5 font-mono text-[11px] leading-[18px] tabular-nums">
        +{children.length}
      </span>
      {differing.length > 0 && (
        <span className="text-warm">
          {differing.map((d) => `${d.n} voted ${d.label}`).join(", ")}
        </span>
      )}
    </button>
  );
}

function Chevron({
  open,
  onToggle,
  label,
}: {
  open: boolean;
  onToggle?: () => void;
  label: string;
}) {
  if (!onToggle) return <span />;
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={label}
      onClick={onToggle}
      className="-m-1 inline-flex cursor-pointer items-center justify-center rounded-sm p-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <ChevronRight
        className={cn("size-3.5 transition-transform", open && "rotate-90")}
      />
    </button>
  );
}

/** Delegators nested under their orchestrator. */
function ChildRows({
  votes,
  series,
  nowMs,
  parentChoice,
}: {
  votes: CastVote[];
  series: TallySeries[];
  nowMs: number;
  parentChoice?: VoteChoice;
}) {
  return (
    <ul className="col-span-full -mx-4 mt-2.5 -mb-2.5 border-t border-hairline bg-foreground/[0.025]">
      {votes.map((v) => {
        const differs = parentChoice != null && v.choice !== parentChoice;
        return (
          <li
            key={v.voter}
            className={cn(
              VOTED_GRID,
              "border-b border-hairline py-2 last:border-0"
            )}
          >
            <span />
            <span className="flex min-w-0 flex-col gap-0.5 pl-5">
              <VoterName
                address={v.voter}
                href={`/accounts/${v.voter}`}
                size={18}
              >
                {differs && (
                  <span className="shrink-0 text-ui-caption text-warm">
                    voted differently
                  </span>
                )}
              </VoterName>
              <span className="font-mono text-[11.5px] text-muted-foreground tabular-nums sm:hidden">
                {formatLPT(v.weight, { compact: true })} ·{" "}
                <When vote={v} nowMs={nowMs} />
              </span>
            </span>
            <span className="justify-self-end sm:justify-self-start">
              <ChoiceLabel choice={v.choice} series={series} />
            </span>
            <span className="hidden justify-self-end text-muted-foreground sm:block">
              <Weight weight={v.weight} />
            </span>
            <span className="hidden justify-self-end text-ui-caption text-muted-foreground sm:block">
              <When vote={v} nowMs={nowMs} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sort: Sort;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  const Arrow = sort.dir === "desc" ? ArrowDown : ArrowUp;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground",
        align === "right" && "justify-self-end",
        active && "text-foreground"
      )}
    >
      {label}
      {active && <Arrow className="size-3" />}
    </button>
  );
}

/* ── Panel ───────────────────────────────────────────────────────────────── */

/**
 * Who voted and which active orchestrators haven't, for a poll or treasury
 * proposal. Orchestrators vote with their delegators' stake; a delegator who
 * votes themselves overrides that for their own stake. Such delegators are
 * nested under their orchestrator (in either list); delegators whose
 * orchestrator didn't vote are listed on their own.
 */
export function VotesPanel({
  votes,
  isLoading,
  error,
  onRetry,
  series,
  electorate,
}: {
  votes: CastVote[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  series: TallySeries[];
  /** Active set and stake the vote is measured against. */
  electorate: Electorate | undefined;
}) {
  const nowMs = useNow(60_000);
  const [list, setList] = useUrlParam<List>(
    "list",
    ["voted", "not-voted"],
    "voted"
  );
  const [limit, setLimit] = useState(PAGE);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "weight", dir: "desc" });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // `?vote=no`; "" (no filter) stays out of the URL.
  const [vote, setVote] = useUrlParam<VoteChoice | "">(
    "vote",
    ["", ...series.map((s) => s.key as VoteChoice)],
    ""
  );
  const choice = vote || null;
  const setChoice = (c: VoteChoice | null) => setVote(c ?? "");

  const all = useMemo(() => votes ?? [], [votes]);
  const active = useMemo(() => electorate?.orchestrators ?? [], [electorate]);
  const voterIds = useMemo(() => new Set(all.map((v) => v.voter)), [all]);
  const nonVoters = useMemo(
    () => active.filter((o) => !voterIds.has(o.id)),
    [active, voterIds]
  );
  /** Delegators who voted, grouped by their orchestrator. */
  const children = useMemo(() => {
    const map = new Map<string, CastVote[]>();
    for (const v of all) {
      if (v.orchestrator || !v.delegate) continue;
      map.set(v.delegate, [...(map.get(v.delegate) ?? []), v]);
    }
    for (const group of map.values()) group.sort((a, b) => b.weight - a.weight);
    return map;
  }, [all]);
  // A delegator is nested when their orchestrator voted too.
  const topLevel = useMemo(
    () =>
      all.filter(
        (v) => v.orchestrator || !v.delegate || !voterIds.has(v.delegate)
      ),
    [all, voterIds]
  );

  const q = query.trim().toLowerCase();
  const addresses = useMemo(
    () => [...all.map((v) => v.voter), ...nonVoters.map((o) => o.id)],
    [all, nonVoters]
  );
  const names = useEnsNames(addresses, q.length > 0);
  const matchesQuery = (address: string) =>
    !q || address.includes(q) || Boolean(names.get(address)?.includes(q));
  const matchesVote = (v: CastVote) =>
    matchesQuery(v.voter) && (!choice || v.choice === choice);
  const filtering = Boolean(q || choice);

  const votedWeight = all.reduce((s, v) => s + v.weight, 0);
  const activeStake = active.reduce((s, o) => s + o.totalStake, 0);
  const missingStake = nonVoters.reduce((s, o) => s + o.totalStake, 0);

  const rank = (v: CastVote) =>
    sort.key === "weight"
      ? v.weight
      : sort.key === "time"
      ? v.timestamp ?? 0
      : series.findIndex((s) => s.key === v.choice);

  // A row shows if it matches, or if one of its nested delegators does (the
  // group then opens so the match is visible).
  const shownVotes = topLevel
    .map((v) => {
      const kids = v.orchestrator ? children.get(v.voter) ?? [] : [];
      const kidMatches = filtering ? kids.filter(matchesVote) : kids;
      return {
        vote: v,
        kids: filtering ? kidMatches : kids,
        self: matchesVote(v),
      };
    })
    .filter((r) => r.self || (filtering && r.kids.length > 0))
    .sort((a, b) => {
      const d = rank(a.vote) - rank(b.vote) || a.vote.weight - b.vote.weight;
      return sort.dir === "asc" ? d : -d;
    });
  const shownNonVoters = nonVoters
    .map((o) => {
      const kids = children.get(o.id) ?? [];
      return {
        o,
        kids: filtering ? kids.filter(matchesVote) : kids,
        self: matchesQuery(o.id),
      };
    })
    .filter((r) => (q ? r.self || r.kids.length > 0 : true));
  const shownRows =
    list === "voted" ? shownVotes.length : shownNonVoters.length;
  const visible = filtering ? shownRows : Math.min(limit, shownRows);

  if (error) return <ErrorNotice error={error} onRetry={onRetry} />;

  const onSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "desc" ? "asc" : "desc" }
        : { key, dir: "desc" }
    );
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const isOpen = (id: string, selfMatches: boolean) =>
    expanded.has(id) || (filtering && !selfMatches);
  const switchTo = (l: List) => {
    // The choice filter only applies to the Voted list.
    if (l === "not-voted") setChoice(null);
    setList(l);
    setLimit(PAGE);
  };

  const counts = series
    .map((s) => ({ ...s, n: all.filter((v) => v.choice === s.key).length }))
    .filter((s) => s.n > 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Votes list"
          value={list}
          onChange={switchTo}
          options={[
            {
              value: "voted",
              label: `Voted${
                votes ? ` · ${votes.length.toLocaleString()}` : ""
              }`,
            },
            {
              value: "not-voted",
              label: `Didn't vote${
                votes && electorate ? ` · ${nonVoters.length}` : ""
              }`,
            },
          ]}
        />
        <label className="relative w-full sm:w-56">
          <span className="sr-only">Search voters</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search address or ENS"
            className="h-8 pl-8 text-ui-body"
          />
        </label>
      </div>

      {votes && (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-caption text-muted-foreground">
          {list === "voted" ? (
            <>
              {counts.map((s) => {
                const on = choice === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={on}
                    title={on ? "Show all votes" : `Only show ${s.label}`}
                    onClick={() => setChoice(on ? null : (s.key as VoteChoice))}
                    className={cn(
                      "-mx-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-hover hover:text-foreground",
                      on && "bg-active text-foreground",
                      choice && !on && "opacity-50"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ background: s.color }}
                    />
                    {s.n.toLocaleString()} {s.label}
                  </button>
                );
              })}
              {electorate && active.length > 0 && (
                <span>
                  {active.length - nonVoters.length} of {active.length} active
                  orchestrators voted
                </span>
              )}
            </>
          ) : electorate ? (
            <span>
              {formatLPT(missingStake, { compact: true })} (
              {pct(activeStake > 0 ? (missingStake / activeStake) * 100 : 0)} of
              active stake) is with orchestrators who haven&apos;t voted. Their
              delegators&apos; stake only counts if they vote themselves.
              {electorate.round != null
                ? ` Active set and stake as of round ${electorate.round.toLocaleString()}.`
                : electorate.fallback
                ? " Based on today's active set and stake; this vote's round isn't indexed yet."
                : ""}
            </span>
          ) : null}
        </p>
      )}

      {isLoading || !votes ? (
        <Card className="flex flex-col gap-4 p-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <div className="flex-1" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </Card>
      ) : list === "voted" && all.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Vote />}
            title="No votes yet"
            description="Votes appear here as soon as they're indexed."
          />
        </Card>
      ) : list === "not-voted" && !electorate ? (
        <Card className="h-40" />
      ) : list === "not-voted" && nonVoters.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users />}
            title="Every active orchestrator voted"
          />
        </Card>
      ) : shownRows === 0 ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="No matches"
            description={
              q
                ? `Nobody in this list matches “${query.trim()}”.`
                : "No votes match this filter."
            }
          />
        </Card>
      ) : list === "voted" ? (
        <Card>
          <div
            className={cn(
              VOTED_GRID,
              "hidden border-b border-hairline py-2.5 text-ui-caption text-muted-foreground sm:grid"
            )}
          >
            <span />
            <span>Voter</span>
            <SortHeader label="Vote" k="choice" sort={sort} onSort={onSort} />
            <SortHeader
              label="Weight"
              k="weight"
              sort={sort}
              onSort={onSort}
              align="right"
            />
            <SortHeader
              label="When"
              k="time"
              sort={sort}
              onSort={onSort}
              align="right"
            />
          </div>
          <ul>
            {shownVotes.slice(0, visible).map(({ vote: v, kids, self }) => {
              const share =
                votedWeight > 0 ? (v.weight / votedWeight) * 100 : 0;
              const open = kids.length > 0 && isOpen(v.voter, self);
              const toggleThis =
                kids.length > 0 ? () => toggle(v.voter) : undefined;
              return (
                <li
                  key={v.voter}
                  className={cn(
                    VOTED_GRID,
                    "border-b border-hairline py-2.5 last:border-0"
                  )}
                >
                  <Chevron
                    open={open}
                    onToggle={toggleThis}
                    label="Delegators who voted separately"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <VoterName
                      address={v.voter}
                      href={
                        v.orchestrator
                          ? `/orchestrators/${v.voter}`
                          : `/accounts/${v.voter}`
                      }
                    >
                      {!v.orchestrator && <Tag>Delegator</Tag>}
                      {!v.orchestrator && v.delegate && (
                        <Via address={v.delegate} />
                      )}
                      {kids.length > 0 && (
                        <GroupSummary
                          votes={kids}
                          parentChoice={v.choice}
                          series={series}
                          open={open}
                          onToggle={() => toggle(v.voter)}
                        />
                      )}
                    </VoterName>
                    <span className="font-mono text-[11.5px] text-muted-foreground tabular-nums sm:hidden">
                      {formatLPT(v.weight, { compact: true })} · {pct(share)} ·{" "}
                      <When vote={v} nowMs={nowMs} />
                    </span>
                  </span>
                  <span className="justify-self-end sm:justify-self-start">
                    <ChoiceLabel choice={v.choice} series={series} />
                  </span>
                  <span className="hidden justify-self-end sm:block">
                    <Weight weight={v.weight} share={share} />
                  </span>
                  <span className="hidden justify-self-end text-ui-caption text-muted-foreground sm:block">
                    <When vote={v} nowMs={nowMs} />
                  </span>
                  {v.reason && <Reason text={v.reason} />}
                  {open && (
                    <ChildRows
                      votes={kids}
                      series={series}
                      nowMs={nowMs}
                      parentChoice={v.choice}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          {!filtering && (
            <ShowAll
              shown={visible}
              total={shownRows}
              onMore={() => setLimit(shownRows)}
            />
          )}
        </Card>
      ) : (
        <Card>
          <div
            className={cn(
              NOT_VOTED_GRID,
              "hidden border-b border-hairline py-2.5 text-ui-caption text-muted-foreground sm:grid"
            )}
          >
            <span />
            <span>Orchestrator</span>
            <span className="text-right">Stake</span>
          </div>
          <ul>
            {shownNonVoters.slice(0, visible).map(({ o, kids, self }) => {
              const open = kids.length > 0 && isOpen(o.id, self);
              return (
                <li
                  key={o.id}
                  className={cn(
                    NOT_VOTED_GRID,
                    "border-b border-hairline py-2.5 last:border-0"
                  )}
                >
                  <Chevron
                    open={open}
                    onToggle={kids.length > 0 ? () => toggle(o.id) : undefined}
                    label="Delegators who voted separately"
                  />
                  <VoterName address={o.id} href={`/orchestrators/${o.id}`}>
                    {kids.length > 0 && (
                      <GroupSummary
                        votes={kids}
                        series={series}
                        open={open}
                        onToggle={() => toggle(o.id)}
                      />
                    )}
                  </VoterName>
                  <Weight
                    weight={o.totalStake}
                    share={
                      activeStake > 0 ? (o.totalStake / activeStake) * 100 : 0
                    }
                  />
                  {open && (
                    <ChildRows votes={kids} series={series} nowMs={nowMs} />
                  )}
                </li>
              );
            })}
          </ul>
          {!filtering && (
            <ShowAll
              shown={visible}
              total={shownRows}
              onMore={() => setLimit(shownRows)}
            />
          )}
        </Card>
      )}
    </div>
  );
}
