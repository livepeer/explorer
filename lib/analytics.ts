import { type BeforeSend, track } from "@vercel/analytics";
import type { InputData, TransactionIdentifier } from "hooks/useExplorerStore";
import type { Config } from "wagmi";
import { getPublicClient } from "wagmi/actions";

/**
 * Replaces wallet addresses in tracked URLs (e.g. `/accounts/0x…`), so
 * pageviews and events can't be tied to a visitor's wallet.
 */
export const redactAddresses: BeforeSend = (event) => ({
  ...event,
  url: event.url.replace(/0x[0-9a-fA-F]{40}/g, "[address]"),
});

export type DelegationFunnelEvent =
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

export const trackVercelAnalyticsEvent = (
  event: DelegationFunnelEvent,
  properties?: Parameters<typeof track>[1]
) => {
  if (typeof window === "undefined") {
    return;
  }

  track(event, properties);
};

const NON_DELEGATION_PATHS = ["/migrate", "/voting", "/treasury"];

/** Coarse entry point a wallet was connected from; never identifying. */
const getWalletConnectSurface = (path: string) => {
  if (path === "/") {
    return "home";
  }
  if (path.startsWith("/orchestrators")) {
    return "orchestrators_list";
  }
  if (path.startsWith("/accounts/")) {
    return path.includes("/orchestrating") ? "orchestrator_detail" : "account";
  }
  return "other";
};

/**
 * Tracks a wallet connect as delegation intent, tagged with the page it was
 * made from. Migration and governance need a wallet for their own reasons,
 * so connects there aren't tracked at all.
 */
export const trackWalletConnected = (asPath: string) => {
  const path = asPath.split("?")[0];

  if (
    NON_DELEGATION_PATHS.some((nonDelegation) => path.startsWith(nonDelegation))
  ) {
    return;
  }

  trackVercelAnalyticsEvent("wallet_connected", {
    surface: getWalletConnectSurface(path),
  });
};

const trackedOnce = new Set<string>();

/**
 * Tracks `event` at most once per page session for `key`, e.g. once per
 * orchestrator no matter how often its pages are revisited.
 */
export const trackVercelAnalyticsEventOnce = (
  event: DelegationFunnelEvent,
  key: string
) => {
  const id = `${event}:${key.toLowerCase()}`;

  if (!trackedOnce.has(id)) {
    trackedOnce.add(id);
    trackVercelAnalyticsEvent(event);
  }
};

type TransactionEvents = {
  submitted: DelegationFunnelEvent;
  confirmed?: DelegationFunnelEvent;
  failed?: DelegationFunnelEvent;
};

const REDELEGATION_EVENTS: TransactionEvents = {
  submitted: "redelegation_started",
};

const DELEGATION_EVENTS: Partial<
  Record<TransactionIdentifier, TransactionEvents>
> = {
  bond: {
    submitted: "delegation_transaction_submitted",
    confirmed: "delegation_transaction_confirmed",
    failed: "delegation_transaction_failed",
  },
  unbond: { submitted: "unbonding_or_exit_started" },
  rebond: REDELEGATION_EVENTS,
  rebondFromUnbonded: REDELEGATION_EVENTS,
};

/**
 * Tracks the funnel events for a submitted contract interaction: submitted
 * right away, then confirmed or failed once it is mined. The receipt is
 * awaited outside React, so the result is still tracked if the sending
 * component unmounts, e.g. when the mobile delegate sheet is closed.
 * "Move Delegated Stake" is a `bond` but counts as a redelegation.
 */
export const trackTransaction = (
  config: Config,
  id: TransactionIdentifier,
  args: InputData,
  hash: `0x${string}`
) => {
  const isRedelegation = id === "bond" && args.isTransferStake;
  const events = isRedelegation ? REDELEGATION_EVENTS : DELEGATION_EVENTS[id];

  if (!events) {
    return;
  }

  trackVercelAnalyticsEvent(events.submitted);

  const { confirmed, failed } = events;
  const client = getPublicClient(config);

  if ((!confirmed && !failed) || !client) {
    return;
  }

  // Replacing the transaction in the wallet with a cancel, or with an
  // unrelated transaction, means this interaction never happened, so neither
  // outcome is tracked. Speeding it up is the same interaction and counts.
  let isAbandoned = false;

  client
    .waitForTransactionReceipt({
      hash,
      timeout: 0,
      onReplaced: ({ reason }) => {
        isAbandoned = reason !== "repriced";
      },
    })
    .then((receipt) => {
      if (isAbandoned) {
        return;
      }

      const event = receipt.status === "success" ? confirmed : failed;

      if (event) {
        trackVercelAnalyticsEvent(event);
      }
    })
    // A receipt we can't fetch, e.g. because of an RPC error, says nothing
    // about whether the interaction succeeded.
    .catch(() => undefined);
};
