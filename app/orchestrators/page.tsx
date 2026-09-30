"use client";

import { ArrowRightLeft, ArrowUp, Info, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useMemo, useState } from "react";

import { Avatar, useEnsNames, useIdentity } from "@/components/identity";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Page,
  PageHeader,
} from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import { Input, Segmented, Skeleton } from "@/components/ui/misc";
import { SortHeader } from "@/components/ui/sort-header";
import { Tooltip } from "@/components/ui/tooltip";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { formatETH, formatLPT, formatNumber, shortAddress } from "@/lib/format";
import { useOrchestrators, usePrices, useProtocol } from "@/lib/hooks/queries";
import {
  expectedApr,
  feeApr,
  MIN_HISTORY,
  rankByYield,
} from "@/lib/orchestrators/ranking";
import { searchRank } from "@/lib/search";
import type { Orchestrator } from "@/lib/subgraph/network";

type SortKey =
  | "stake"
  | "apr"
  | "calls"
  | "rewardCut"
  | "feeShare"
  | "fees"
  | "delegators";

const RELIABLE_HINT =
  "Reliable orchestrators called reward in every completed round they were active over the last 30 (30/30 in Reward calls). A missed call means its delegators earn no inflation rewards that round. It doesn't measure how well it handles video or AI work, or the fees it earns.";

/** A filter option with how many orchestrators it shows. */
function Counted({ label, n }: { label: string; n: number | undefined }) {
  return (
    <>
      {label}
      {n != null && (
        <span className="ml-1.5 font-mono text-[11px] text-muted-foreground tabular-nums">
          {n}
        </span>
      )}
    </>
  );
}

/** An orchestrator with its fee yield, once prices are in. */
type Listed = Orchestrator & { feeApr: number | null };

const SORTS: Record<SortKey, (o: Listed) => number> = {
  stake: (o) => o.totalStake,
  apr: (o) => expectedApr(o) ?? -1,
  calls: (o) => (o.rewardWindow ? o.rewardCalls / o.rewardWindow : 0),
  rewardCut: (o) => o.rewardCut,
  feeShare: (o) => o.feeShare,
  fees: (o) => o.thirtyDayVolumeETH,
  delegators: (o) => o.delegatorCount,
};

function NameCell({ o, rank }: { o: Orchestrator; rank: number | null }) {
  const { name, avatar } = useIdentity(o.id);
  return (
    <Link
      href={`/orchestrators/${o.id}`}
      className="flex min-w-0 items-center gap-3 outline-none"
    >
      <span className="w-6 shrink-0 text-right font-mono text-[11px] text-subtle-foreground tabular-nums">
        {rank}
      </span>
      <Avatar address={o.id} src={avatar} size={28} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-ui-body text-foreground group-hover:underline group-hover:decoration-foreground/30 group-hover:underline-offset-4">
          {name ?? (
            <span className="font-mono text-[13px]">{shortAddress(o.id)}</span>
          )}
        </span>
        {name && (
          <span className="font-mono text-[11px] text-subtle-foreground">
            {shortAddress(o.id)}
          </span>
        )}
      </span>
    </Link>
  );
}

function CallsMeter({ calls, window }: { calls: number; window: number }) {
  const pct = window ? calls / window : 0;
  const missed = window - calls;
  return (
    <Tooltip
      content={
        missed === 0
          ? `Called reward every round (${window}/${window})`
          : `Missed ${missed} of the last ${window} reward calls`
      }
    >
      <span className="inline-flex cursor-default items-center gap-2">
        <span
          className="flex h-1.5 w-14 overflow-hidden rounded-full bg-foreground/8"
          aria-hidden="true"
        >
          <span
            className={cn(
              "h-full rounded-full",
              missed > 2 ? "bg-warm" : "bg-foreground/60"
            )}
            style={{ width: `${pct * 100}%` }}
          />
        </span>
        <span
          className={cn(
            "font-mono text-[12px] tabular-nums",
            missed > 2 ? "text-warm" : "text-muted-foreground"
          )}
        >
          {calls}/{window}
        </span>
      </span>
    </Tooltip>
  );
}

const pct = (n: number) => `${n.toFixed(n % 1 ? 1 : 0)}%`;

/** Days since a timestamp, for "raised 6 days ago". */
const daysAgo = (ts: number) => {
  const d = Math.floor((Date.now() / 1000 - ts) / 86400);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`;
};

/** The cut, marked when it went up during the window. */
function CutValue({ o }: { o: Orchestrator }) {
  if (o.cutRaisedFrom == null) return <>{pct(o.rewardCut)}</>;
  return (
    <Tooltip
      content={`Raised from ${pct(o.cutRaisedFrom)} ${daysAgo(
        o.rewardCutUpdateTimestamp
      )}. Its realised APR was earned at the lower cut, so it's ranked on what the new cut pays.`}
    >
      <span className="inline-flex cursor-default items-center gap-0.5 text-warm">
        <ArrowUp className="size-3" aria-label="Raised" />
        {pct(o.rewardCut)}
      </span>
    </Tooltip>
  );
}

/**
 * Realised rewards plus fees, with the split on hover, and what a new
 * delegator can expect when a raised cut makes that lower.
 */
function AprValue({ o }: { o: Listed }) {
  if (o.realizedApr == null) return <>—</>;
  const fees = o.feeApr ?? 0;
  const total = o.realizedApr + fees;
  const expected = expectedApr(o);
  const lower = expected != null && expected < total - 0.05 ? expected : null;
  return (
    <>
      <Tooltip
        content={
          <span className="flex flex-col gap-1">
            <span>
              Rewards {o.realizedApr.toFixed(1)}%, paid over the last 30 rounds.
            </span>
            {o.feeApr != null ? (
              <span>
                Fees {o.feeApr.toFixed(1)}%, from the last 90 days at a{" "}
                {pct(o.feeShare)} fee share, valued at today&apos;s ETH/LPT
                price.
              </span>
            ) : (
              <span>Fees aren&apos;t counted: prices are unavailable.</span>
            )}
            {o.selfPaidFees90 > 0 && (
              <span>
                Leaves out {formatETH(o.selfPaidFees90)} it paid itself as a
                gateway.
              </span>
            )}
          </span>
        }
      >
        <span className="cursor-default">{total.toFixed(1)}%</span>
      </Tooltip>
      {lower != null && (
        <div className="text-[11px] text-warm">
          ~{lower.toFixed(1)}% at new cut
        </div>
      )}
    </>
  );
}

type Row = { o: Listed; rank: number | null; fresh: boolean };

function OrchestratorTable() {
  const params = useSearchParams();
  const router = useRouter();
  const moving = params.get("move") === "1";
  // The query waits for the protocol, and reports isLoading: false while it
  // does, so "not loaded yet" is isPending, on the server too. A failed
  // protocol read is this page's error as well, not an endless skeleton.
  const {
    data: raw,
    error: listError,
    isPending,
    refetch,
  } = useOrchestrators();
  const {
    data: protocol,
    error: protocolError,
    refetch: refetchProtocol,
  } = useProtocol();
  const error = listError ?? protocolError;
  const { data: prices } = usePrices();
  const lptPerEth = prices?.eth && prices?.lpt ? prices.eth / prices.lpt : null;
  const data = useMemo(
    (): Listed[] | undefined =>
      raw?.map((o) => ({
        ...o,
        feeApr: lptPerEth ? feeApr(o, lptPerEth) : null,
      })),
    [raw, lptPerEth]
  );
  const { open } = useStaking();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("apr");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [filter, setFilter] = useState<"all" | "reliable">("all");
  const [amount, setAmount] = useState("1000");
  const ids = useMemo(() => (data ?? []).map((o) => o.id), [data]);
  // The rows resolve these names anyway; the filter reads the same cache.
  const names = useEnsNames(ids, true);

  const rows = useMemo((): Row[] => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    let ordered: Row[];
    if (sort === "apr") {
      // By yield, with orchestrators too new to judge in a group of their own.
      const { ranked, fresh } = rankByYield(data);
      if (dir === "asc") ranked.reverse();
      ordered = [
        ...ranked.map((o, i) => ({ o, rank: i + 1, fresh: false })),
        ...fresh.map((o) => ({ o, rank: null, fresh: true })),
      ];
    } else {
      ordered = [...data]
        .sort((a, b) => {
          const d = SORTS[sort](a) - SORTS[sort](b);
          return dir === "desc" ? -d : d;
        })
        .map((o, i) => ({ o, rank: i + 1, fresh: false }));
    }
    // Filter after numbering, so a row keeps its place when you search.
    return ordered
      .filter(({ o }) => searchRank(o.id, names.get(o.id), q) != null)
      .filter(({ o }) => filter === "all" || o.rewardCalls >= o.rewardWindow);
  }, [data, query, sort, dir, filter, names]);
  const firstFresh = rows.findIndex((r) => r.fresh);
  const reliableCount = data?.filter(
    (o) => o.rewardCalls >= o.rewardWindow
  ).length;

  const onSort = (k: SortKey) => {
    if (k === sort) setDir(dir === "desc" ? "asc" : "desc");
    else {
      setSort(k);
      setDir(k === "rewardCut" ? "asc" : "desc");
    }
  };

  const stakeAmount = Number(amount) || 0;
  const totalStake = protocol?.totalActiveStake;

  return (
    <>
      {moving && (
        <div className="mb-6 flex items-center gap-3 rounded-md border border-hairline bg-surface px-4 py-3">
          <ArrowRightLeft className="size-4 text-muted-foreground" />
          <p className="flex-1 text-ui-body text-muted-foreground">
            Choose the orchestrator to switch to. Your full stake moves in one
            transaction.
          </p>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel switch"
            onClick={() => router.replace("/orchestrators")}
          >
            <X />
          </Button>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or address"
            aria-label="Filter orchestrators by ENS name or address"
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex h-9 items-center gap-2 rounded-sm bg-hover pr-1 pl-3 text-ui-caption text-muted-foreground">
            Estimate for
            <input
              value={amount}
              inputMode="decimal"
              onChange={(e) =>
                /^\d*\.?\d*$/.test(e.target.value) && setAmount(e.target.value)
              }
              aria-label="Stake amount for yearly estimate"
              className="h-7 w-20 rounded-[4px] bg-background/60 px-2 text-right font-mono text-[13px] text-foreground tabular-nums outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40 light:bg-background"
            />
            LPT
          </label>
          <Segmented
            label="Filter"
            value={filter}
            onChange={setFilter}
            options={[
              {
                value: "all",
                label: <Counted label="All active" n={data?.length} />,
              },
              {
                value: "reliable",
                label: <Counted label="Reliable only" n={reliableCount} />,
              },
            ]}
          />
          <Tooltip content={RELIABLE_HINT}>
            <button
              type="button"
              aria-label="What does Reliable mean?"
              className="-ml-1.5 inline-flex size-7 cursor-help items-center justify-center rounded-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40"
            >
              <Info className="size-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {error ? (
        <ErrorNotice
          error={error}
          onRetry={() => (protocolError ? refetchProtocol() : refetch())}
        />
      ) : (
        <>
          {/* Phones: condensed cards with the figures that decide a delegation. */}
          <Card className="divide-y divide-(--hairline) md:hidden">
            {isPending &&
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4">
                  <Skeleton className="size-7 rounded-full" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
              ))}
            {rows.map(({ o, rank }, i) => (
              <Fragment key={o.id}>
                {i === firstFresh && <FreshHeading className="px-4 py-3" />}
                <div className="flex flex-col gap-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <NameCell o={o} rank={rank} />
                    <Button
                      size="xs"
                      onClick={() => open({ kind: "delegate", to: o.id })}
                    >
                      {moving ? "Switch here" : "Delegate"}
                    </Button>
                  </div>
                  <dl className="grid grid-cols-3 gap-3 pl-9">
                    {[
                      ["Realised APR", <AprValue key="apr" o={o} />],
                      [
                        "Cut · Share",
                        <>
                          <CutValue o={o} /> · {pct(o.feeShare)}
                        </>,
                      ],
                      ["Stake", formatLPT(o.totalStake, { compact: true })],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="flex min-w-0 flex-col gap-0.5"
                      >
                        <dt className="text-[11px] text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="truncate font-mono text-[12.5px] tabular-nums">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="pl-9">
                    <CallsMeter calls={o.rewardCalls} window={o.rewardWindow} />
                  </div>
                </div>
              </Fragment>
            ))}
            {!isPending && rows.length === 0 && (
              <EmptyState title="No orchestrators match" />
            )}
          </Card>
          <Card className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[940px] text-left text-ui-body">
              <thead>
                <tr className="border-b border-hairline text-ui-caption">
                  <th className="sticky left-0 z-10 bg-surface px-3 py-2.5 pl-4 font-normal text-muted-foreground">
                    Orchestrator
                  </th>
                  <SortHeader
                    label="Realised APR"
                    k="apr"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                    hint="What delegators actually earned, annualised: inflation rewards over the last 30 rounds plus ETH fees over the last 90 days, valued at today's ETH/LPT price. Fees an orchestrator paid itself as a gateway are left out. Hover a figure for the split."
                  />
                  <th className="px-3 py-2.5 text-right font-normal whitespace-nowrap text-muted-foreground">
                    Est. yearly
                  </th>
                  <SortHeader
                    label="Reward calls"
                    k="calls"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                    hint="Completed rounds in which the orchestrator called reward, out of the last 30 it was active. A missed call means its delegators earn no rewards that round."
                  />
                  <SortHeader
                    label="Reward cut"
                    k="rewardCut"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                    hint="Share of inflationary rewards the orchestrator keeps."
                  />
                  <SortHeader
                    label="Fee share"
                    k="feeShare"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                    hint="Share of ETH fees passed on to delegators."
                  />
                  <SortHeader
                    label="30d fees"
                    k="fees"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                  />
                  <SortHeader
                    label="Total stake"
                    k="stake"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                  />
                  <SortHeader
                    label="Delegators"
                    k="delegators"
                    sort={sort}
                    dir={dir}
                    onSort={onSort}
                  />
                  <th className="w-24 px-3 py-2.5" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {isPending &&
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr
                      key={i}
                      className="border-b border-hairline last:border-0"
                    >
                      <td className="px-4 py-3.5" colSpan={10}>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-7 rounded-full" />
                          <Skeleton className="h-3.5 w-40" />
                          <Skeleton className="ml-auto h-3.5 w-1/2" />
                        </div>
                      </td>
                    </tr>
                  ))}
                {rows.map(({ o, rank }, i) => {
                  const share = totalStake
                    ? (o.totalStake / totalStake) * 100
                    : null;
                  const expected = expectedApr(o) ?? o.realizedApr;
                  return (
                    <Fragment key={o.id}>
                      {i === firstFresh && (
                        <tr className="border-b border-hairline">
                          <td colSpan={10} className="px-4 py-3">
                            <FreshHeading />
                          </td>
                        </tr>
                      )}
                      <tr className="group border-b border-hairline transition-colors last:border-0 hover:bg-hover/60">
                        <td className="sticky left-0 z-10 bg-surface px-3 py-3 pl-1 group-hover:bg-[color-mix(in_oklch,var(--surface),var(--foreground)_2.5%)]">
                          <NameCell o={o} rank={rank} />
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap tabular-nums">
                          <AprValue o={o} />
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
                          {expected != null && stakeAmount > 0
                            ? `+${formatNumber(stakeAmount * (expected / 100), {
                                decimals:
                                  stakeAmount * (expected / 100) >= 100 ? 0 : 1,
                              })}`
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <CallsMeter
                            calls={o.rewardCalls}
                            window={o.rewardWindow}
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap tabular-nums">
                          <CutValue o={o} />
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap tabular-nums">
                          {o.feeShare.toFixed(o.feeShare % 1 ? 1 : 0)}%
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
                          {o.thirtyDayVolumeETH > 0
                            ? formatETH(o.thirtyDayVolumeETH)
                            : "—"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="font-mono text-[13px] whitespace-nowrap tabular-nums">
                            {formatLPT(o.totalStake, { compact: true })}
                          </div>
                          {share != null && (
                            <div className="font-mono text-[11px] text-subtle-foreground tabular-nums">
                              {share.toFixed(2)}%
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
                          {o.delegatorCount >= 1000
                            ? "1,000+"
                            : o.delegatorCount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 pr-4 text-right">
                          <Button
                            size="xs"
                            className={cn(
                              !moving &&
                                "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 max-lg:opacity-100"
                            )}
                            onClick={() => open({ kind: "delegate", to: o.id })}
                          >
                            {moving ? "Switch here" : "Delegate"}
                          </Button>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            {!isPending && rows.length === 0 && (
              <EmptyState
                title="No orchestrators match"
                description="Try a different name or address, or clear the filter."
              />
            )}
          </Card>
        </>
      )}
      {data && (
        <p className="mt-3 text-[11px] text-subtle-foreground">
          Ranked by what delegators earned: rewards over the last 30 rounds,
          adjusted down where an orchestrator has since raised its reward cut,
          plus fees over the last 90 days at today&apos;s ETH/LPT price.
          Near-ties go to the smaller orchestrator. Past yield doesn&apos;t
          guarantee future yield.
        </p>
      )}
    </>
  );
}

/** Heads the orchestrators too new to rank. */
function FreshHeading({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-ui-caption text-foreground">
        New, not ranked yet
      </span>
      <span className="text-[11px] text-muted-foreground">
        In the active set for fewer than {MIN_HISTORY} of the last 30 rounds,
        too few to judge what they pay.
      </span>
    </div>
  );
}

export default function OrchestratorsPage() {
  const { data } = useOrchestrators();
  useEffect(() => trackEvent("orchestrators_page_viewed"), []);
  return (
    <Page>
      <PageHeader
        title="Orchestrators"
        description={
          data
            ? `${data.length} orchestrators in the active set, ranked by what each actually paid its delegators.`
            : "The active set, ranked by what each orchestrator actually paid its delegators."
        }
      />
      <Suspense fallback={<Skeleton className="h-[480px] w-full rounded-md" />}>
        <OrchestratorTable />
      </Suspense>
    </Page>
  );
}
