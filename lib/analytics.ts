import { type BeforeSend, track } from "@vercel/analytics";
import type { Config } from "wagmi";
import { getPublicClient } from "wagmi/actions";

import { L2_CHAIN } from "@/lib/config";

/*
 * The delegation funnel from the instrumentation plan (livepeer/explorer#722).
 * Event names match the previous explorer's, so the two versions can be
 * compared event for event in Web Analytics, split by hostname.
 *
 * Nothing tracked identifies anyone: no addresses, ENS names, transaction
 * hashes or error text, in event properties or in URLs.
 */

export type FunnelEvent =
  | "earn_entry_point_clicked"
  | "orchestrators_nav_clicked"
  | "orchestrators_page_viewed"
  | "orchestrator_detail_viewed"
  | "wallet_connected"
  | "delegation_form_started"
  | "delegation_transaction_submitted"
  | "delegation_transaction_confirmed"
  | "delegation_transaction_failed"
  | "account_delegating_tab_viewed"
  | "redelegation_started"
  | "unbonding_or_exit_started";

/** Replaces addresses and ENS names in tracked URLs, e.g. `/accounts/0x…`. */
export const redactUrl: BeforeSend = (event) => ({
  ...event,
  url: event.url
    .replace(/0x[0-9a-fA-F]{40}/g, "[address]")
    .replace(/[\w-]+(\.[\w-]+)*\.eth\b/gi, "[name]"),
});

let queued = false;

/**
 * `track` drops events until <Analytics /> has mounted and set up its queue,
 * and on a full page load a page's own effects run first. So set up the same
 * queue here, with the redaction ahead of any event, and let the script work
 * through it once it loads.
 */
function ensureQueue() {
  if (queued) return;
  queued = true;
  window.va ??= (...params: [string, unknown?]) => {
    (window.vaq ??= []).push(params);
  };
  window.va("beforeSend", redactUrl);
}

export function trackEvent(
  event: FunnelEvent,
  properties?: Record<string, string>
) {
  if (typeof window === "undefined") return;
  ensureQueue();
  track(event, properties);
}

const trackedOnce = new Set<string>();

/**
 * Tracks `event` at most once per page session for `key`, e.g. once per
 * orchestrator however often its page is revisited.
 */
export function trackEventOnce(event: FunnelEvent, key: string) {
  const id = `${event}:${key.toLowerCase()}`;
  if (trackedOnce.has(id)) return;
  trackedOnce.add(id);
  trackEvent(event);
}

/** Coarse page a wallet was connected from; never identifying. */
function connectSurface(path: string) {
  if (path === "/") return "home";
  if (path === "/orchestrators") return "orchestrators_list";
  if (path.startsWith("/orchestrators/")) return "orchestrator_detail";
  if (path.startsWith("/accounts/")) return "account";
  return "other";
}

/**
 * Tracks a wallet connect as delegation intent, tagged with the page it was
 * made from. Governance needs a wallet for its own reasons, so connects
 * there aren't tracked.
 */
export function trackWalletConnected(path: string) {
  if (path.startsWith("/governance")) return;
  trackEvent("wallet_connected", { surface: connectSurface(path) });
}

type TransactionEvents = {
  submitted: FunnelEvent;
  confirmed?: FunnelEvent;
  failed?: FunnelEvent;
};

export const DELEGATION_EVENTS: TransactionEvents = {
  submitted: "delegation_transaction_submitted",
  confirmed: "delegation_transaction_confirmed",
  failed: "delegation_transaction_failed",
};
/** Switching orchestrator, or putting undelegating LPT back. */
export const REDELEGATION_EVENTS: TransactionEvents = {
  submitted: "redelegation_started",
};
export const UNBONDING_EVENTS: TransactionEvents = {
  submitted: "unbonding_or_exit_started",
};

/**
 * Tracks a sent transaction: submitted right away, then confirmed or failed
 * once it's mined. The receipt is awaited outside React, so the result is
 * still tracked if the dialog is closed first. Only for transactions with an
 * on-chain hash, never Safe proposals.
 */
export function trackTransaction(
  config: Config,
  events: TransactionEvents,
  hash: `0x${string}`
) {
  trackEvent(events.submitted);

  const { confirmed, failed } = events;
  const client = getPublicClient(config, { chainId: L2_CHAIN.id });
  if ((!confirmed && !failed) || !client) return;

  // Replacing the transaction in the wallet with a cancel, or with an
  // unrelated transaction, means this one never happened, so neither outcome
  // is tracked. Speeding it up is the same transaction and counts.
  let abandoned = false;
  client
    .waitForTransactionReceipt({
      hash,
      timeout: 0,
      onReplaced: ({ reason }) => {
        abandoned = reason !== "repriced";
      },
    })
    .then((receipt) => {
      if (abandoned) return;
      const event = receipt.status === "success" ? confirmed : failed;
      if (event) trackEvent(event);
    })
    // A receipt we can't fetch, e.g. after an RPC error, says nothing about
    // whether the transaction succeeded.
    .catch(() => undefined);
}
