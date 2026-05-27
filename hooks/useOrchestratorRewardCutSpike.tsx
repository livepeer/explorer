import { PERCENTAGE_PRECISION_MILLION } from "@utils/web3";
import {
  OrderDirection,
  TranscoderUpdateEvent_OrderBy,
  useTranscoderUpdateEventsQuery,
} from "apollo";
import { useMemo } from "react";

/** Minimum upward swing (0..1) within any ROLLING_WINDOW_DAYS window to count as a spike. */
export const REWARD_CUT_SPIKE_PP = 0.5;
/** Width of the sliding window within which any qualifying upward swing fires the warning. */
export const ROLLING_WINDOW_DAYS = 7;
/** Age cutoff beyond which a spike no longer drives a warning. */
export const WARNING_WINDOW_DAYS = 180;

const MS_PER_DAY = 86_400_000;

export type CutEvent = {
  timestamp: number;
  rewardCut: string;
};

export type RewardCutSpike = {
  /** ms — timestamp of the event that closes the qualifying window. */
  endTimestamp: number;
  /** Lowest reward cut in the window, 0..1. */
  fromRewardCut: number;
  /** Reward cut at the end of the window, 0..1. */
  toRewardCut: number;
};

/**
 * Most recent ≥REWARD_CUT_SPIKE_PP upward swing in reward cut across any
 * ROLLING_WINDOW_DAYS-day window in the last WARNING_WINDOW_DAYS days, or
 * null. Up-only — downward changes never fire. Events sorted defensively.
 */
export function findRecentRewardCutSpike(
  events: ReadonlyArray<CutEvent>,
  options: { now?: number } = {}
): RewardCutSpike | null {
  if (events.length < 2) return null;

  const now = options.now ?? Date.now();
  const warningCutoffMs = now - WARNING_WINDOW_DAYS * MS_PER_DAY;
  const windowMs = ROLLING_WINDOW_DAYS * MS_PER_DAY;

  // Walk newest -> oldest, return on the first qualifying spike. Break
  // (not continue) on the cutoff since later indices are also older.
  const eventsDesc = [...events].sort((a, b) => b.timestamp - a.timestamp);
  for (let i = 0; i < eventsDesc.length - 1; i++) {
    const endEvent = eventsDesc[i];
    const endMs = endEvent.timestamp * 1000;
    if (endMs < warningCutoffMs) break;

    // Lowest cut anywhere in the window. The first event at-or-before
    // windowStart caps the search — it's the cut value active when the
    // window opened, and older events were already superseded by it.
    const windowStartMs = endMs - windowMs;
    let minCut = Infinity;
    for (let j = i + 1; j < eventsDesc.length; j++) {
      const ej = eventsDesc[j];
      const cutJ = Number(ej.rewardCut) / PERCENTAGE_PRECISION_MILLION;
      if (cutJ < minCut) minCut = cutJ;
      if (ej.timestamp * 1000 <= windowStartMs) break;
    }

    const endCut = Number(endEvent.rewardCut) / PERCENTAGE_PRECISION_MILLION;
    if (endCut - minCut >= REWARD_CUT_SPIKE_PP) {
      return {
        endTimestamp: endMs,
        fromRewardCut: minCut,
        toRewardCut: endCut,
      };
    }
  }

  return null;
}

/**
 * Most recent reward-cut spike (a rolling-window rise past the configured
 * threshold), or null. Shares the `useOrchestratorCutHistory` Apollo
 * query (cache-deduped to one fetch).
 */
export function useOrchestratorRewardCutSpike(
  orchestratorId?: string | null
): RewardCutSpike | null {
  // 1000 most recent events, no pagination — enough for the 180-day window.
  const { data } = useTranscoderUpdateEventsQuery({
    variables: {
      where: { delegate: orchestratorId },
      first: 1000,
      orderBy: TranscoderUpdateEvent_OrderBy.Timestamp,
      orderDirection: OrderDirection.Desc,
    },
    skip: !orchestratorId,
  });

  return useMemo(
    () => findRecentRewardCutSpike(data?.transcoderUpdateEvents ?? []),
    [data]
  );
}
