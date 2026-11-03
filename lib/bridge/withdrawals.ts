"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useReadContracts } from "wagmi";

import { useNow } from "@/components/shell/round-clock";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { L1_CHAIN } from "@/lib/config";
import { fromWei } from "@/lib/format";

import { inBatches } from "./batch";
import { L1_LPT } from "./config";
import { localList } from "./local-list";
import {
  isLocalFresh,
  mergeWithdrawals,
  type SentWithdrawal,
} from "./progress";
import type { BridgeWithdrawal } from "./types";

/* ── Withdrawals sent from this browser, until the index has them ────── */

const sent = localList<SentWithdrawal>(
  "livepeer-explorer.bridge-withdrawals-sent"
);
const readSent = sent.read;
const writeSent = sent.write;
const subscribeSent = sent.subscribe;

/** Remember a withdrawal just sent, so every view shows it at once. */
export function addSentWithdrawal(w: SentWithdrawal) {
  writeSent([...readSent().filter((x) => x.tx !== w.tx), w]);
}

/* ── Withdrawals just claimed from this browser ─────────────────────── */

/**
 * Claimed here, by id, until when to keep hiding them. The list is cached
 * by the browser and the CDN, so a refetch right after a claim can still
 * show it as ready; hidden meanwhile, and fetched past both caches.
 */
const claimed = new Map<string, number>();
const CLAIMED_MS = 10 * 60_000;
let claimedVersion = 0;
const claimedListeners = new Set<() => void>();

/** A claim just confirmed: hide it, and fetch the list fresh for a while. */
export function markClaimed(id: string) {
  claimed.set(id, Date.now() + CLAIMED_MS);
  claimedVersion++;
  claimedListeners.forEach((l) => l());
}

function subscribeClaimed(l: () => void) {
  claimedListeners.add(l);
  return () => {
    claimedListeners.delete(l);
  };
}

function justClaimed() {
  const now = Date.now();
  for (const [id, until] of claimed) if (until < now) claimed.delete(id);
  return claimed;
}

const EMPTY: SentWithdrawal[] = [];
let cache: { raw: string; list: SentWithdrawal[] } | null = null;
function snapshot() {
  const list = readSent();
  const raw = JSON.stringify(list);
  if (!cache || cache.raw !== raw) cache = { raw, list };
  return cache.list;
}

/**
 * Unclaimed LPT withdrawals to Ethereum sent from or to these addresses,
 * including ones just sent from this browser that the index hasn't picked
 * up yet. While any of those are waiting, it checks every 15s, skipping
 * the browser's cache, and drops each local copy once indexed. Indexed
 * ones still waiting keep being checked, so they turn claimable in place.
 */
export function useBridgeWithdrawals(addresses: string[]) {
  const key = useMemo(
    () => [...addresses].map((a) => a.toLowerCase()).sort(),
    [addresses]
  );
  const all = useSyncExternalStore(subscribeSent, snapshot, () => EMPTY);
  // Only to tell fresh local copies from expired ones: a coarse clock is fine.
  const nowSec = Math.floor(useNow(60_000) / 1000);
  // Copies past their day are dropped: the index never showed them (one
  // claimed elsewhere first never will), and checking for them every 15s
  // would never end.
  useEffect(() => {
    const expired = all.filter((s) => !isLocalFresh(s.timestamp, nowSec));
    if (expired.length) {
      const drop = new Set(expired.map((s) => s.tx));
      writeSent(readSent().filter((s) => !drop.has(s.tx)));
    }
  }, [all, nowSec]);
  const sent = useMemo(
    () =>
      all.filter(
        (s) =>
          isLocalFresh(s.timestamp, nowSec) &&
          (key.includes(s.from.toLowerCase()) ||
            key.includes(s.to.toLowerCase()))
      ),
    [all, key, nowSec]
  );
  const query = useQuery({
    queryKey: ["bridge-withdrawals", key],
    enabled: key.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => {
      // Just sent from here: until the index has it.
      if (sent.length) return 15_000;
      // Just claimed here: until the server agrees it's gone.
      const data = q.state.data as BridgeWithdrawal[] | undefined;
      if (data?.some((w) => justClaimed().has(w.id))) return 15_000;
      // Waiting ones turn claimable on their own: check every minute once
      // one is due, every 10 otherwise, so Claim shows without a reload.
      const waiting = (q.state.data as BridgeWithdrawal[] | undefined)
        ?.filter((w) => w.status === "waiting")
        .map((w) => w.readyAt ?? 0);
      if (!waiting?.length) return false;
      const soonest = Math.min(...waiting) - Date.now() / 1000;
      return soonest < 15 * 60 ? 60_000 : 10 * 60_000;
    },
    // Any size of portfolio: the API takes 20 addresses a request.
    queryFn: () =>
      inBatches(
        key,
        async (batch) => {
          // A withdrawal just sent or claimed: skip the browser's cached
          // answer, and the CDN's, which is keyed by the whole URL.
          const fresh = sent.length > 0 || justClaimed().size > 0;
          const res = await fetch(
            `/api/bridge/withdrawals?address=${batch}${
              fresh ? `&fresh=${Date.now()}` : ""
            }`,
            { cache: fresh ? "no-store" : "default" }
          );
          if (!res.ok) throw new Error("Couldn't check bridge withdrawals");
          const { withdrawals } = (await res.json()) as {
            withdrawals: BridgeWithdrawal[];
          };
          return withdrawals;
        },
        (w) => w.id
      ),
  });

  // The index has them now: this browser's copies aren't needed.
  useEffect(() => {
    if (!query.data || !sent.length) return;
    const indexed = new Set(query.data.map((w) => w.tx.toLowerCase()));
    const done = sent.filter((s) => indexed.has(s.tx.toLowerCase()));
    if (done.length) {
      const drop = new Set(done.map((s) => s.tx));
      writeSent(readSent().filter((s) => !drop.has(s.tx)));
    }
  }, [query.data, sent]);

  const version = useSyncExternalStore(
    subscribeClaimed,
    () => claimedVersion,
    () => 0
  );
  const data = useMemo(
    () =>
      query.data || sent.length
        ? mergeWithdrawals(query.data ?? [], sent, nowSec).filter(
            (w) => !justClaimed().has(w.id)
          )
        : undefined,
    // `version`: a claim just confirmed, which the cached list still shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, sent, nowSec, version]
  );
  return { ...query, data };
}

/** Below this, LPT on Ethereum is dust rather than something to bridge. */
const L1_DUST = 0.01;

/** LPT each address holds on Ethereum, where it can't be delegated. */
export function useL1Lpt(addresses: string[]) {
  const { data } = useReadContracts({
    contracts: addresses.map((a) => ({
      address: L1_LPT as `0x${string}`,
      abi: livepeerToken,
      functionName: "balanceOf",
      args: [a as `0x${string}`],
      chainId: L1_CHAIN.id,
    })),
    query: { enabled: addresses.length > 0, staleTime: 60_000 },
  });
  return useMemo(() => {
    const out = new Map<string, number>();
    data?.forEach((r, i) => {
      if (r.status !== "success") return;
      const lpt = fromWei(r.result as bigint);
      if (lpt >= L1_DUST) out.set(addresses[i], lpt);
    });
    return out;
  }, [data, addresses]);
}
