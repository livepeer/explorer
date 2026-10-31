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
import { mergeDeposits } from "./progress";
import type { TrackedDeposit } from "./types";

const EMPTY: PendingDeposit[] = [];
let cache: { raw: string; list: PendingDeposit[] } | null = null;
function snapshot() {
  const list = readPendingDeposits();
  const raw = JSON.stringify(list);
  if (!cache || cache.raw !== raw) cache = { raw, list };
  return cache.list;
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
  const local = useMemo(
    () =>
      all.filter(
        (d) =>
          key.includes(d.to.toLowerCase()) || key.includes(d.from.toLowerCase())
      ),
    [all, key]
  );

  const { data: tracked } = useQuery({
    queryKey: ["bridge-deposits", key],
    enabled: key.length > 0,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => {
      const list = q.state.data as TrackedDeposit[] | undefined;
      // A failed one won't change: no need to keep checking for it.
      const moving =
        local.length > 0 ||
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
        (d) => `${d.l1Tx.toLowerCase()}:${d.seq ?? ""}`
      ).then((list) => list.sort((a, b) => b.sentAt - a.sentAt)),
  });

  // The chain has them now: this browser's copies aren't needed.
  useEffect(() => {
    if (!tracked) return;
    const seen = new Set(tracked.map((d) => d.l1Tx.toLowerCase()));
    const done = local.filter((d) => seen.has(d.l1Tx.toLowerCase()));
    if (done.length) removePendingDeposits(done.map((d) => d.l1Tx));
  }, [tracked, local]);

  // One arrived while we watched: Ethereum and Arbitrum balances changed.
  const moving = useRef(new Set<string>());
  useEffect(() => {
    if (!tracked) return;
    let landed = false;
    for (const d of tracked) {
      if (d.status === "arrived") {
        if (moving.current.delete(d.l1Tx)) landed = true;
      } else {
        moving.current.add(d.l1Tx);
      }
    }
    if (landed) {
      queryClient.invalidateQueries({ queryKey: ["readContracts"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    }
  }, [tracked, queryClient]);

  // Only to drop local copies the chain never showed: a coarse clock is fine.
  const nowSec = Math.floor(useNow(60_000) / 1000);
  return useMemo(
    () => mergeDeposits(tracked ?? [], local, nowSec),
    [tracked, local, nowSec]
  );
}
