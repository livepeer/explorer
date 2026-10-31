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
import { mergeWithdrawals, type SentWithdrawal } from "./progress";
import type { BridgeWithdrawal } from "./types";

/* ── Withdrawals sent from this browser, until the index has them ────── */

const KEY = "livepeer-explorer.bridge-withdrawals-sent";
const listeners = new Set<() => void>();

function readSent(): SentWithdrawal[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeSent(list: SentWithdrawal[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode: it just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

/** Remember a withdrawal just sent, so every view shows it at once. */
export function addSentWithdrawal(w: SentWithdrawal) {
  writeSent([...readSent().filter((x) => x.tx !== w.tx), w]);
}

function subscribeSent(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
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
  const sent = useMemo(
    () =>
      all.filter(
        (s) =>
          key.includes(s.from.toLowerCase()) || key.includes(s.to.toLowerCase())
      ),
    [all, key]
  );
  const query = useQuery({
    queryKey: ["bridge-withdrawals", key],
    enabled: key.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => {
      // Just sent from here: until the index has it.
      if (sent.length) return 15_000;
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
          // A withdrawal just sent: skip the browser's cached answer.
          const res = await fetch(`/api/bridge/withdrawals?address=${batch}`, {
            cache: sent.length ? "no-store" : "default",
          });
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

  // Only to drop local copies the index never showed: a coarse clock is fine.
  const nowSec = Math.floor(useNow(60_000) / 1000);
  const data = useMemo(
    () =>
      query.data || sent.length
        ? mergeWithdrawals(query.data ?? [], sent, nowSec)
        : undefined,
    [query.data, sent, nowSec]
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
