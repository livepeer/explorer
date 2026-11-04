"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { useNow } from "@/components/shell/round-clock";

import { inBatches } from "./batch";
import {
  type PendingDeposit,
  readPendingDeposits,
  removePendingDeposits,
  subscribePendingDeposits,
} from "./deposit";
import {
  depositKey,
  isLocalFresh,
  landedSince,
  mergeDeposits,
} from "./progress";
import type { TrackedDeposit } from "./types";

/* ── Arrivals, announced once however many views watch them ────────── */

const arrivalListeners = new Set<(d: TrackedDeposit) => void>();
const announced = new Set<string>();

/**
 * Hears each deposit that lands on Arbitrum while some view was watching
 * it, once. Returns the unsubscribe.
 */
export function onDepositArrived(l: (d: TrackedDeposit) => void) {
  arrivalListeners.add(l);
  return () => {
    arrivalListeners.delete(l);
  };
}

function announce(d: TrackedDeposit) {
  const id = depositKey(d);
  if (announced.has(id)) return;
  announced.add(id);
  arrivalListeners.forEach((l) => l(d));
}

const EMPTY: PendingDeposit[] = [];
let cache: { raw: string; list: PendingDeposit[] } | null = null;
function snapshot() {
  const list = readPendingDeposits();
  const raw = JSON.stringify(list);
  if (!cache || cache.raw !== raw) cache = { raw, list };
  return cache.list;
}

/**
 * The deposits these (sorted, lowercased) addresses sent or received this
 * week, every status included, as the server reports them. Shared by every
 * view of the same addresses. Checks every 20s while any are on their way
 * (`sentHere`: some sent from this browser aren't reported yet).
 */
function depositsQuery(key: string[], sentHere: boolean) {
  return {
    queryKey: ["bridge-deposits", key],
    enabled: key.length > 0,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (q: { state: { data?: TrackedDeposit[] } }) => {
      const list = q.state.data;
      // A failed one won't change: no need to keep checking for it.
      const moving =
        sentHere ||
        list?.some((d) => d.status === "processing" || d.status === "retry");
      return moving ? 20_000 : 5 * 60_000;
    },
    // Any size of portfolio: the API takes 20 addresses a request.
    queryFn: () =>
      inBatches(
        key,
        async (batch) => {
          const res = await fetch(`/api/bridge/deposits?address=${batch}`);
          if (!res.ok) throw new Error("Couldn't check deposits");
          return (await res.json()).deposits as TrackedDeposit[];
        },
        depositKey
      ).then((list) => list.sort((a, b) => b.sentAt - a.sentAt)),
  };
}

/**
 * Where one deposit stands now, from its recipient's deposits: arrived
 * included, which the pending list leaves out. Undefined until the list
 * loads, or if the list doesn't have it.
 */
export function useDepositStatus(d: TrackedDeposit) {
  const key = useMemo(() => [d.to.toLowerCase()], [d.to]);
  const { data } = useQuery(depositsQuery(key, false));
  return data?.find((x) => depositKey(x) === depositKey(d))?.status;
}

/**
 * LPT on its way from Ethereum to Arbitrum for these addresses, sent from
 * here or anywhere else: processing, or needing a retry. Checks every 20s
 * while any are on their way (every few minutes otherwise, to find ones
 * sent elsewhere), and refreshes balances when one arrives.
 */
export function usePendingDeposits(addresses: string[]) {
  const all = useSyncExternalStore(
    subscribePendingDeposits,
    snapshot,
    () => EMPTY
  );
  const queryClient = useQueryClient();
  const key = useMemo(
    () => [...addresses].map((a) => a.toLowerCase()).sort(),
    [addresses]
  );
  // Only to tell fresh local copies from expired ones: a coarse clock is fine.
  const nowSec = Math.floor(useNow(60_000) / 1000);
  // Copies past their day are dropped: the chain never showed them, and
  // checking for them every 20s would never end.
  useEffect(() => {
    const expired = all.filter((d) => !isLocalFresh(d.sentAt, nowSec));
    if (expired.length) removePendingDeposits(expired.map((d) => d.l1Tx));
  }, [all, nowSec]);
  const local = useMemo(
    () =>
      all.filter(
        (d) =>
          isLocalFresh(d.sentAt, nowSec) &&
          (key.includes(d.to.toLowerCase()) ||
            key.includes(d.from.toLowerCase()))
      ),
    [all, key, nowSec]
  );

  const { data: tracked } = useQuery(depositsQuery(key, local.length > 0));

  // The chain has them now: this browser's copies aren't needed.
  useEffect(() => {
    if (!tracked) return;
    const seen = new Set(tracked.map((d) => d.l1Tx.toLowerCase()));
    const done = local.filter((d) => seen.has(d.l1Tx.toLowerCase()));
    if (done.length) removePendingDeposits(done.map((d) => d.l1Tx));
  }, [tracked, local]);

  // One arrived while we watched: Ethereum and Arbitrum balances changed.
  // Sent from here counts as watched from the start, even if the chain
  // reports it only once it has already arrived.
  // Watched by deposit (transaction and message number), so one landing
  // from a batch doesn't stand for the rest. A copy sent from here has no
  // message number yet: it's watched by its transaction, which counts for
  // every deposit in it.
  const moving = useRef(new Set<string>());
  useEffect(() => {
    for (const d of local) moving.current.add(d.l1Tx.toLowerCase());
    if (!tracked) return;
    const landed = landedSince(moving.current, tracked);
    landed.forEach(announce);
    if (landed.length) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    }
  }, [tracked, local, queryClient]);

  return useMemo(
    () => mergeDeposits(tracked ?? [], local, nowSec),
    [tracked, local, nowSec]
  );
}
