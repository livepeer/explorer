"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Which part of the portfolio you're looking at: every account ("all") or
 * one address. Shared by the sidebar switcher and the portfolio page, and
 * remembered per browser. Independent of the wallet's signing account.
 */

const KEY = "livepeer-explorer.view";
const EVENT = `${KEY}:changed`;
let memory = "all";

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "all";
  } catch {
    return memory;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function write(next: string) {
  memory = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // blocked storage: kept in memory for this page
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * A wallet was just connected, or the wallet switched accounts: show it,
 * unless you're looking at all wallets, which already includes it.
 */
export function followActiveWallet(address: string) {
  if (read() !== "all") write(address.toLowerCase());
}

export function useViewScope(accounts: string[]) {
  const raw = useSyncExternalStore(subscribe, read, () => "all");
  // A view that no longer exists (forgotten wallet) falls back to all.
  const scope = raw !== "all" && !accounts.includes(raw) ? "all" : raw;

  const setScope = useCallback((next: string) => write(next), []);

  return [scope, setScope] as const;
}
