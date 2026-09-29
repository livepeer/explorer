"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo } from "react";

import {
  fetchGateway,
  fetchGatewayPayouts,
  fetchGateways,
} from "@/lib/subgraph/gateways";
import {
  type FeedFilter,
  fetchAccountEvents,
  fetchAddressEvents,
  fetchDays,
  fetchEvents,
  fetchFeedPage,
  fetchFeedSince,
  fetchGatewayEvents,
  fetchGovernance,
  fetchOrchestrator,
  fetchOrchestrators,
  fetchOrchestratorUpdates,
  fetchProtocol,
  fetchRewardProgress,
  fetchTransactionEvents,
} from "@/lib/subgraph/network";
import { type Cursor, FIRST_CURSOR } from "@/lib/subgraph/paging";
import { fetchPortfolio } from "@/lib/subgraph/portfolio";
import {
  fetchElectorate,
  fetchPollVotes,
  fetchProposalVotes,
  fetchRoundAtBlock,
} from "@/lib/subgraph/votes";

const MINUTE = 60_000;

export function useProtocol() {
  return useQuery({
    queryKey: ["protocol"],
    queryFn: fetchProtocol,
    staleTime: MINUTE,
    refetchInterval: MINUTE,
  });
}

export function usePortfolio(addresses: string[]) {
  const key = [...addresses].map((a) => a.toLowerCase()).sort();
  return useQuery({
    queryKey: ["portfolio", key],
    queryFn: () => fetchPortfolio(key),
    enabled: key.length > 0,
    staleTime: 5 * MINUTE,
    placeholderData: keepPreviousData,
  });
}

export function useOrchestrators() {
  const { data: protocol } = useProtocol();
  return useQuery({
    queryKey: ["orchestrators", protocol?.currentRound],
    queryFn: () => fetchOrchestrators(protocol!),
    enabled: Boolean(protocol),
    staleTime: 5 * MINUTE,
  });
}

export function useOrchestrator(id: string) {
  const { data: protocol } = useProtocol();
  return useQuery({
    queryKey: ["orchestrator", id.toLowerCase(), protocol?.currentRound],
    queryFn: () => fetchOrchestrator(id, protocol!),
    enabled: Boolean(protocol),
    staleTime: 5 * MINUTE,
  });
}

export function useGateways({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["gateways"],
    queryFn: () => fetchGateways(),
    enabled,
    staleTime: 10 * MINUTE,
  });
}

/** One gateway; resolves to null for an address that has never funded one. */
export function useGateway(id: string | null | undefined) {
  return useQuery({
    queryKey: ["gateway", id?.toLowerCase()],
    queryFn: () => fetchGateway(id!),
    enabled: Boolean(id),
    staleTime: 5 * MINUTE,
  });
}

/** Who a gateway paid over the last 90 days. */
export function useGatewayPayouts(id: string | undefined) {
  return useQuery({
    queryKey: ["gateway-payouts", id?.toLowerCase()],
    queryFn: () =>
      fetchGatewayPayouts(id!, Math.floor(Date.now() / 1000) - 90 * 86400),
    enabled: Boolean(id),
    staleTime: 10 * MINUTE,
  });
}

export function useGatewayEvents(id: string | undefined, first = 50) {
  return useQuery({
    queryKey: ["gateway-events", id?.toLowerCase(), first],
    queryFn: () => fetchGatewayEvents(id!, first),
    enabled: Boolean(id),
    staleTime: MINUTE,
  });
}

export function useDays(first = 365) {
  return useQuery({
    queryKey: ["days", first],
    queryFn: () => fetchDays(first),
    staleTime: 30 * MINUTE,
  });
}

/** Protocol-wide events, polled often enough to feel live. */
export function useEvents(first = 100) {
  return useQuery({
    queryKey: ["events", first],
    queryFn: () => fetchEvents(first),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

/** Who has called reward in the current round so far. */
export function useRewardProgress(round: number | undefined) {
  return useQuery({
    queryKey: ["reward-progress", round],
    queryFn: () => fetchRewardProgress(round!),
    enabled: round != null,
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
}

/**
 * The protocol feed for a filter: pages of older events on request, plus a
 * live head polling for anything newer than the first page. The head only
 * ever asks for newer events, so pages already loaded never shift.
 */
export function useFeed(filter: FeedFilter, enabled = true) {
  const queryClient = useQueryClient();
  const pages = useInfiniteQuery({
    queryKey: ["feed", filter],
    queryFn: ({ pageParam }) => fetchFeedPage(filter, pageParam),
    initialPageParam: FIRST_CURSOR as Cursor,
    getNextPageParam: (last) => last.next,
    enabled,
    staleTime: Infinity,
  });
  const base = pages.data?.pages[0]?.events[0]?.timestamp;
  const head = useQuery({
    queryKey: ["feed-since", filter, base],
    queryFn: () => fetchFeedSince(filter, base!),
    enabled: enabled && base != null,
    refetchInterval: 15_000,
  });

  // A head this long has probably missed some: start again from the top.
  useEffect(() => {
    if ((head.data?.length ?? 0) >= 100)
      queryClient.resetQueries({ queryKey: ["feed", filter] });
  }, [head.data, filter, queryClient]);

  const events = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...(head.data ?? []),
      ...(pages.data?.pages ?? []).flatMap((p) => p.events),
    ]
      .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [head.data, pages.data]);

  return {
    events: pages.data ? events : undefined,
    isLoading: pages.isLoading,
    error: pages.error ?? head.error,
    refetch: pages.refetch,
    updatedAt: Math.max(head.dataUpdatedAt, pages.dataUpdatedAt),
    hasMore: pages.hasNextPage,
    loadingMore: pages.isFetchingNextPage,
    loadMore: () => pages.fetchNextPage(),
  };
}

/**
 * Everything involving an address, newest first, a page at a time. The
 * filter is part of the query, so filtered results reach back through all
 * of the address's history, not just what's loaded.
 */
export function useAddressEvents(
  address: string | null,
  filter: FeedFilter = "all"
) {
  return useInfiniteQuery({
    queryKey: ["address-events", address?.toLowerCase(), filter],
    queryFn: ({ pageParam }) => fetchAddressEvents(address!, filter, pageParam),
    initialPageParam: FIRST_CURSOR as Cursor,
    getNextPageParam: (last) => last.next,
    enabled: Boolean(address),
    staleTime: MINUTE,
  });
}

export function useTransactionEvents(hash: string | null) {
  return useQuery({
    queryKey: ["transaction-events", hash?.toLowerCase()],
    queryFn: () => fetchTransactionEvents(hash!),
    enabled: Boolean(hash),
    staleTime: 5 * MINUTE,
  });
}

export function useAccountEvents(ids: string[], first = 50) {
  const key = [...ids].map((a) => a.toLowerCase()).sort();
  return useQuery({
    queryKey: ["account-events", key, first],
    queryFn: () => fetchAccountEvents(key, first),
    enabled: key.length > 0,
    staleTime: MINUTE,
  });
}

export function useOrchestratorUpdates(ids: string[], sinceTs: number) {
  const key = [...new Set(ids.map((a) => a.toLowerCase()))].sort();
  return useQuery({
    queryKey: ["orchestrator-updates", key, Math.floor(sinceTs / 3600)],
    queryFn: () => fetchOrchestratorUpdates(key, sinceTs),
    enabled: key.length > 0,
    staleTime: 10 * MINUTE,
  });
}

export function useGovernance() {
  return useQuery({
    queryKey: ["governance"],
    queryFn: fetchGovernance,
    staleTime: 5 * MINUTE,
  });
}

export function usePollVotes(poll: string | undefined) {
  return useQuery({
    queryKey: ["votes", "poll", poll],
    queryFn: () => fetchPollVotes(poll!),
    enabled: Boolean(poll),
    staleTime: MINUTE,
  });
}

export function useProposalVotes(proposal: string | undefined) {
  return useQuery({
    queryKey: ["votes", "proposal", proposal],
    queryFn: () => fetchProposalVotes(proposal!),
    enabled: Boolean(proposal),
    staleTime: MINUTE,
  });
}

/**
 * The active set and stake a vote is measured against: a past round's
 * (by round, or by the L1 block a poll ended at), or null when no snapshot
 * applies or the round has no pools indexed.
 */
export function useElectorate(at: { round?: number; block?: number } | null) {
  return useQuery({
    queryKey: ["electorate", at?.round ?? null, at?.block ?? null],
    queryFn: async () => {
      const round =
        at?.round ??
        (at?.block != null ? await fetchRoundAtBlock(at.block) : null);
      return round != null ? fetchElectorate(round) : null;
    },
    enabled: at != null,
    staleTime: 60 * MINUTE,
  });
}

/** LPT and ETH in USD. Non-critical: every caller renders without it. */
export function usePrices() {
  return useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=livepeer,ethereum&vs_currencies=usd&include_24hr_change=true"
      );
      if (!res.ok) throw new Error("price unavailable");
      const json = await res.json();
      return {
        lpt: json?.livepeer?.usd as number | undefined,
        lptChange24h: json?.livepeer?.usd_24h_change as number | undefined,
        eth: json?.ethereum?.usd as number | undefined,
      };
    },
    staleTime: 5 * MINUTE,
    retry: 1,
  });
}
