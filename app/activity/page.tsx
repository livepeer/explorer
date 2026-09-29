"use client";

import { ArrowUp, ExternalLink, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { isAddress, isHash } from "viem";
import { normalize } from "viem/ens";
import { useEnsAddress } from "wagmi";

import { ActivityList } from "@/components/activity-list";
import { Identity } from "@/components/identity";
import { LiveStatus } from "@/components/live-status";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Page,
  PageHeader,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input, Segmented, Skeleton } from "@/components/ui/misc";
import { L1_CHAIN, txUrl } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { useLiveFeed } from "@/lib/hooks/live-feed";
import {
  useAddressEvents,
  useFeed,
  useOrchestrators,
  useTransactionEvents,
} from "@/lib/hooks/queries";

type Filter =
  | "all"
  | "fees"
  | "staking"
  | "rewards"
  | "governance"
  | "orchestrators"
  | "gateways";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "fees", label: "Fees" },
  { value: "staking", label: "Staking" },
  { value: "rewards", label: "Rewards" },
  { value: "governance", label: "Governance" },
  { value: "orchestrators", label: "Orchestrators" },
  { value: "gateways", label: "Gateways" },
] as const;

const EMPTY: Record<Filter, string> = {
  all: "No recent activity.",
  fees: "No recent fee activity.",
  staking: "No recent staking activity.",
  rewards: "No recent reward calls.",
  governance: "No recent votes.",
  orchestrators: "No recent orchestrator changes.",
  gateways: "No recent gateway deposits or withdrawals.",
};

/** What the search box holds: an address, a transaction, an ENS name. */
function parseQuery(raw: string) {
  const q = raw.trim();
  if (isAddress(q)) return { kind: "address" as const, value: q.toLowerCase() };
  if (isHash(q)) return { kind: "tx" as const, value: q.toLowerCase() };
  if (/\.[a-z]{2,}$/i.test(q)) {
    try {
      return { kind: "ens" as const, value: normalize(q) };
    } catch {
      return null;
    }
  }
  return null;
}

/** The protocol feed: the latest events live, older ones on request. */
function LiveActivity({
  feed,
  filter,
}: {
  feed: ReturnType<typeof useFeed>;
  filter: Filter;
}) {
  const { shown, fresh, waiting, reveal } = useLiveFeed(feed.events);
  return (
    <>
      {waiting > 0 && (
        <div className="pointer-events-none sticky top-16 z-20 flex justify-center lg:top-4">
          <button
            type="button"
            onClick={reveal}
            className="pointer-events-auto inline-flex animate-rise cursor-pointer items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-ui-caption font-medium text-background shadow-(--shadow-popover)"
          >
            <ArrowUp className="size-3.5" />
            {waiting} new {waiting === 1 ? "event" : "events"}
          </button>
        </div>
      )}
      {feed.error && !feed.events ? (
        <ErrorNotice error={feed.error} onRetry={() => feed.refetch()} />
      ) : (
        <div className="flex flex-col gap-3">
          <ActivityList
            events={shown}
            loading={feed.isLoading || !shown}
            emptyText={EMPTY[filter]}
            fresh={fresh}
          />
          {feed.hasMore && shown && (
            <Button
              variant="ghost"
              size="sm"
              className="self-center"
              disabled={feed.loadingMore}
              onClick={() => feed.loadMore()}
            >
              {feed.loadingMore ? "Loading…" : "Show more"}
            </Button>
          )}
        </div>
      )}
    </>
  );
}

/** Everything involving one address, loaded a page at a time. */
function AddressActivity({
  address,
  filter,
}: {
  address: string;
  filter: Filter;
}) {
  const q = useAddressEvents(address, filter);
  const events = useMemo(() => {
    // Pages can repeat rows that share a timestamp across the boundary.
    const seen = new Set<string>();
    return q.data?.pages
      .flatMap((p) => p.events)
      .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  }, [q.data]);
  if (q.error && !q.data)
    return <ErrorNotice error={q.error} onRetry={() => q.refetch()} />;
  return (
    <div className="flex flex-col gap-3">
      <ActivityList
        events={events}
        loading={q.isLoading}
        emptyText={
          filter === "all"
            ? "No activity for this address yet."
            : "Nothing of this kind for this address."
        }
      />
      {q.hasNextPage && (
        <Button
          variant="ghost"
          size="sm"
          className="self-center"
          disabled={q.isFetchingNextPage}
          onClick={() => q.fetchNextPage()}
        >
          {q.isFetchingNextPage ? "Loading…" : "Show more"}
        </Button>
      )}
    </div>
  );
}

function TransactionActivity({ hash }: { hash: string }) {
  const { data, isLoading, error, refetch } = useTransactionEvents(hash);
  if (error) return <ErrorNotice error={error} onRetry={() => refetch()} />;
  if (data === null)
    return (
      <Card>
        <EmptyState
          title="Transaction not found"
          description="The subgraph has no Livepeer events for this transaction. It may not be indexed yet, or it isn't a Livepeer transaction."
          action={
            <a
              href={txUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-ui-caption text-foreground underline-offset-4 hover:underline"
            >
              View on Arbiscan <ExternalLink className="size-3" />
            </a>
          }
        />
      </Card>
    );
  return (
    <ActivityList
      events={data}
      loading={isLoading}
      emptyText="This transaction has no Livepeer events."
    />
  );
}

function ActivityView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const urlQuery = params.get("q") ?? "";
  const [input, setInput] = useState(urlQuery);
  const [filter, setFilter] = useState<Filter>("all");
  const { data: orchestrators } = useOrchestrators();
  const feed = useFeed(filter, !urlQuery);

  // Follow the URL (back/forward, links from other pages).
  useEffect(() => setInput(urlQuery), [urlQuery]);

  const parsed = parseQuery(urlQuery);
  const { data: ensAddress, isFetching: resolving } = useEnsAddress({
    name: parsed?.kind === "ens" ? parsed.value : undefined,
    chainId: L1_CHAIN.id,
    query: { enabled: parsed?.kind === "ens", retry: false },
  });
  const address =
    parsed?.kind === "address"
      ? parsed.value
      : parsed?.kind === "ens"
      ? ensAddress?.toLowerCase() ?? null
      : null;
  const tx = parsed?.kind === "tx" ? parsed.value : null;
  const searching = Boolean(urlQuery);
  const inputValid = !input.trim() || parseQuery(input) !== null;

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const isOrchestrator = address
    ? orchestrators?.some((o) => o.id === address)
    : false;

  return (
    <Page>
      <PageHeader
        title="Activity"
        description="Every protocol event on Arbitrum as it's indexed: fees earned, delegations, reward calls, votes and gateway deposits. Search an address to see everything it's been part of."
        actions={
          searching ? undefined : (
            <LiveStatus
              updatedAt={feed.updatedAt}
              failing={Boolean(feed.error)}
            />
          )
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          className="relative w-full lg:max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValid) setQuery(input.trim());
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={input}
            onChange={(e) => {
              const v = e.target.value;
              setInput(v);
              // A complete address or hash searches straight away; names
              // wait for Enter, since "vitalik.et" is a prefix, not a name.
              const p = parseQuery(v);
              if (!v.trim()) setQuery("");
              else if (p && p.kind !== "ens") setQuery(v.trim());
            }}
            placeholder="Address, ENS name or transaction hash"
            aria-label="Search activity"
            aria-invalid={!inputValid}
            className="pr-8 pl-8 font-mono text-[13px] placeholder:font-sans"
          />
          {input && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setInput("");
                setQuery("");
              }}
              className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>
        {!tx && (
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <Segmented
              label="Filter events"
              value={filter}
              onChange={setFilter}
              options={FILTERS}
            />
          </div>
        )}
      </div>

      {searching && (
        <div className="mb-4 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-2 text-ui-body text-muted-foreground">
          {address ? (
            <>
              <span>Activity involving</span>
              <Identity address={address} size={22} />
              <Link
                href={
                  isOrchestrator
                    ? `/orchestrators/${address}`
                    : `/accounts/${address}`
                }
                className="text-ui-caption text-foreground underline-offset-4 hover:underline"
              >
                {isOrchestrator ? "Orchestrator profile" : "Account"}
              </Link>
            </>
          ) : tx ? (
            <span>
              Events in transaction{" "}
              <span className="font-mono text-foreground">
                {shortAddress(tx, 10, 8)}
              </span>
            </span>
          ) : parsed?.kind === "ens" && resolving ? (
            <Skeleton className="h-4 w-48" />
          ) : (
            <span>
              {parsed?.kind === "ens"
                ? `No address found for ${parsed.value}.`
                : "Enter a full address, ENS name or transaction hash."}
            </span>
          )}
        </div>
      )}

      {address ? (
        <AddressActivity address={address} filter={filter} />
      ) : tx ? (
        <TransactionActivity hash={tx} />
      ) : searching ? null : (
        // A new filter is a new feed, not a batch of arrivals.
        <LiveActivity key={filter} feed={feed} filter={filter} />
      )}
    </Page>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<Skeleton className="m-10 h-96 rounded-md" />}>
      <ActivityView />
    </Suspense>
  );
}
