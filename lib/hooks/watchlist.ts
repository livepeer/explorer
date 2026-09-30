"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { isAddress } from "viem";
import { useAccount, useAccountEffect } from "wagmi";

import { followActiveWallet } from "./view-scope";

/**
 * The portfolio is a list of addresses, kept per browser. One of them may
 * be connected right now, and only that one can sign; acting for another
 * asks you to connect it. Connecting a wallet adds its address.
 */

export type SavedAccount = { address: string; label?: string };

const KEY = "livepeer-explorer.watchlist";
/** Earlier builds kept connected wallets in a second list; folded in. */
const LEGACY_WALLETS_KEY = "livepeer-explorer.wallets";
const EVENT = `${KEY}:changed`;
const EMPTY: SavedAccount[] = [];

// Last value read or written. Also the fallback when storage is blocked
// (private mode), so the list still works for the life of the page.
let cache: { raw: string | null; value: SavedAccount[] } = {
  raw: null,
  value: EMPTY,
};

const parse = (raw: string | null): SavedAccount[] => {
  try {
    const parsed = JSON.parse(raw ?? "[]");
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed
      .filter(
        (a): a is SavedAccount =>
          a && typeof a.address === "string" && isAddress(a.address)
      )
      .map((a) => ({ address: a.address.toLowerCase(), label: a.label }));
  } catch {
    return EMPTY;
  }
};

let migrated = false;
/** Fold the old connected-wallets list into this one, once. */
function migrate() {
  if (migrated) return;
  migrated = true;
  try {
    const legacy = parse(window.localStorage.getItem(LEGACY_WALLETS_KEY));
    if (!legacy.length) return;
    const current = parse(window.localStorage.getItem(KEY));
    const known = new Set(current.map((a) => a.address));
    const merged = [...legacy.filter((a) => !known.has(a.address)), ...current];
    window.localStorage.setItem(KEY, JSON.stringify(merged));
    window.localStorage.removeItem(LEGACY_WALLETS_KEY);
  } catch {
    // Blocked storage: nothing to migrate.
  }
}

function read(): SavedAccount[] {
  migrate();
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cache.value;
  }
  if (raw === cache.raw) return cache.value;
  cache = { raw, value: parse(raw) };
  return cache.value;
}

function write(next: SavedAccount[]) {
  const raw = JSON.stringify(next);
  cache = { raw, value: next };
  try {
    window.localStorage.setItem(KEY, raw);
  } catch {
    // Blocked storage: the in-memory cache carries it for this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function add(address: string, label?: string) {
  const current = read();
  const lower = address.toLowerCase();
  if (current.some((a) => a.address === lower)) return;
  write([...current, { address: lower, label: label?.trim() || undefined }]);
}

function remove(address: string) {
  const lower = address.toLowerCase();
  write(read().filter((a) => a.address !== lower));
}

function rename(address: string, label: string) {
  const lower = address.toLowerCase();
  write(
    read().map((a) =>
      a.address === lower ? { ...a, label: label.trim() || undefined } : a
    )
  );
}

/** The portfolio's addresses and ways to change them. */
export function useAddresses() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  // Module-level functions: already stable across renders.
  return { list, add, remove, rename };
}

/**
 * Adds each account as it connects, and shows it when you connect a
 * wallet or switch accounts in one. Mount once, app-wide.
 */
export function AddressMemory() {
  const { address, isConnected } = useAccount();
  useEffect(() => {
    if (isConnected && address) add(address);
  }, [address, isConnected]);

  // A page load that quietly reconnects keeps the view you left.
  useAccountEffect({
    onConnect: ({ address: a, isReconnected }) => {
      if (!isReconnected) followActiveWallet(a);
    },
  });
  const previous = useRef<string | undefined>(undefined);
  useEffect(() => {
    const lower = isConnected ? address?.toLowerCase() : undefined;
    if (previous.current && lower && previous.current !== lower)
      followActiveWallet(lower);
    previous.current = lower;
  }, [address, isConnected]);
  return null;
}

export type PortfolioAccount = {
  address: string;
  label?: string;
  /** Connected in your wallet now: the one that can sign. */
  connected: boolean;
};

/** The connected address first, then the rest in the order added. */
export function usePortfolioAccounts() {
  const { address, isConnected, status } = useAccount();
  const { list } = useAddresses();
  const active = isConnected && address ? address.toLowerCase() : null;

  const accounts = useMemo(() => {
    const labelOf = (a: string) => list.find((w) => w.address === a)?.label;
    const rest = list
      .filter((a) => a.address !== active)
      .map((a) => ({ ...a, connected: false }));
    return active
      ? [{ address: active, label: labelOf(active), connected: true }, ...rest]
      : rest;
  }, [active, list]);

  const members = useMemo(
    () => new Set(accounts.map((a) => a.address)),
    [accounts]
  );

  return {
    accounts,
    walletAddress: active,
    /** In the portfolio: its actions are offered (connecting it if needed). */
    inPortfolio: useCallback(
      (a: string) => members.has(a.toLowerCase()),
      [members]
    ),
    isReconnecting: status === "reconnecting" || status === "connecting",
  };
}
