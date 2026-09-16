import { type BeforeSend, track } from "@vercel/analytics";
import type { InputData, TransactionIdentifier } from "hooks/useExplorerStore";
import { type BaseError, type RpcError, UserRejectedRequestError } from "viem";

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

type TransactionEvents = Partial<
  Record<TransactionStage, DelegationFunnelEvent>
>;

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

type TransactionStage = "submitted" | "confirmed" | "failed";

/**
 * Whether the user rejected the request in their wallet. viem nests the
 * wallet's error in `cause`; matched on its code rather than `instanceof`
 * because several viem copies are installed.
 */
const isUserRejection = (error?: Error) =>
  Boolean(
    (error as BaseError | undefined)?.walk?.(
      (e) => (e as RpcError).code === UserRejectedRequestError.code
    )
  );

/**
 * Tracks the funnel event, if any, for a contract interaction reaching
 * `stage`. "Move Delegated Stake" is a `bond` but counts as a redelegation.
 * A rejected signature isn't a failed transaction: nothing was submitted.
 */
export const trackTransactionEvent = (
  id: TransactionIdentifier,
  stage: TransactionStage,
  args: InputData,
  error?: Error
) => {
  if (stage === "failed" && isUserRejection(error)) {
    return;
  }

  const isRedelegation = id === "bond" && args.isTransferStake;
  const events = isRedelegation ? REDELEGATION_EVENTS : DELEGATION_EVENTS[id];
  const eventName = events?.[stage];

  if (eventName) {
    trackVercelAnalyticsEvent(eventName);
  }
};
