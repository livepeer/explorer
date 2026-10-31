import type { BridgeWithdrawal, TrackedDeposit } from "./types";

/** How far along a withdrawal is through Arbitrum's period, 0–1. */
export function withdrawalProgress(w: BridgeWithdrawal, nowSec: number) {
  if (w.status === "ready" || w.readyAt == null) return 1;
  const span = Math.max(1, w.readyAt - w.timestamp);
  return Math.min(1, Math.max(0, (nowSec - w.timestamp) / span));
}

/** "day 3 of 7", counting the period in whole days. */
export function withdrawalDay(w: BridgeWithdrawal, nowSec: number) {
  if (w.readyAt == null) return null;
  const total = Math.max(1, Math.ceil((w.readyAt - w.timestamp) / 86_400));
  const n = Math.min(
    total,
    Math.max(1, Math.ceil((nowSec - w.timestamp) / 86_400))
  );
  return `day ${n} of ${total}`;
}

/** A wait, roughly: "~4 days", "~1 day", "~5 hours", "~20 min". */
export function waitText(seconds: number) {
  if (seconds <= 0) return "a moment";
  const days = Math.round(seconds / 86_400);
  if (days >= 1) return `~${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.round(seconds / 3600);
  if (hours >= 1) return `~${hours} hour${hours === 1 ? "" : "s"}`;
  return `~${Math.max(1, Math.round(seconds / 60))} min`;
}

/** A deposit usually lands within this. */
const DEPOSIT_SECONDS = 15 * 60;

/**
 * A deposit's countdown, from when it was sent: minutes left (0 once it's
 * due any moment) and progress, 0–0.95 (never shown done until it has
 * arrived). Whether it needs attention comes from its ticket, not the clock.
 */
export function depositTiming(sentAt: number, nowSec: number) {
  const age = Math.max(0, nowSec - sentAt);
  return {
    minutesLeft: Math.max(0, Math.ceil((DEPOSIT_SECONDS - age) / 60)),
    progress: Math.min(0.95, age / DEPOSIT_SECONDS),
  };
}

/** A deposit sent from here that Ethereum never showed is dropped after this. */
const LOCAL_SECONDS = 24 * 3600;

/**
 * Deposits found on-chain plus ones just sent from this browser, which
 * Ethereum may not have included yet. Once the chain shows a deposit, it
 * speaks for it. Only those still on their way are kept.
 */
export function mergeDeposits(
  tracked: TrackedDeposit[],
  local: Omit<TrackedDeposit, "status" | "retryBy">[],
  nowSec: number
): TrackedDeposit[] {
  const known = new Set(tracked.map((d) => d.l1Tx.toLowerCase()));
  const fresh = local
    .filter((d) => !known.has(d.l1Tx.toLowerCase()))
    .filter((d) => nowSec - d.sentAt < LOCAL_SECONDS)
    .map((d) => ({ ...d, status: "processing" as const }));
  return [...fresh, ...tracked].filter((d) => d.status !== "arrived");
}
