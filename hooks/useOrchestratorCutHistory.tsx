import type { ChartDatum } from "@components/ExplorerChart";
import { PERCENTAGE_PRECISION_MILLION } from "@utils/web3";
import {
  OrderDirection,
  TranscoderUpdateEvent_OrderBy,
  useTranscoderUpdateEventsQuery,
} from "apollo";
import { useMemo } from "react";

type CutDataPoint = {
  timestamp: number;
  rewardCut: number;
  feeCut: number;
};

/**
 * Minimal orchestrator shape this hook consumes. Compatible with both the
 * full `account.transcoder` and partial `delegator.delegate` fragments;
 * missing fields degrade gracefully via optional access.
 */
type OrchestratorRef = Partial<{
  id: string;
  activationTimestamp: number;
  rewardCut: string;
  feeShare: string;
}>;

export type UseOrchestratorCutHistoryReturn = {
  /** Reward cut over time, ready for `ExplorerChart`. */
  rewardCutData: ChartDatum[];
  /** Fee cut over time, ready for `ExplorerChart`. */
  feeCutData: ChartDatum[];
  /** Current reward cut (0..1), or 0 if unknown. */
  baseRewardCut: number;
  /** Current fee cut (0..1), or 0 if unknown. */
  baseFeeCut: number;
  /** True while the underlying subgraph query is in flight. */
  loading: boolean;
};

/**
 * Reward-cut and fee-cut time series for chart plotting. Adds activation
 * and "now" anchors so the chart extends end-to-end.
 */
export function useOrchestratorCutHistory(
  transcoder?: OrchestratorRef | null
): UseOrchestratorCutHistoryReturn {
  const { data, loading } = useTranscoderUpdateEventsQuery({
    variables: {
      where: { delegate: transcoder?.id },
      first: 1000,
      orderBy: TranscoderUpdateEvent_OrderBy.Timestamp,
      orderDirection: OrderDirection.Asc,
    },
    skip: !transcoder?.id,
  });

  const points = useMemo<CutDataPoint[]>(() => {
    const events: CutDataPoint[] = (data?.transcoderUpdateEvents ?? []).map(
      (event) => ({
        timestamp: event.timestamp * 1000, // Convert to ms
        rewardCut: Number(event.rewardCut) / PERCENTAGE_PRECISION_MILLION,
        feeCut: 1 - Number(event.feeShare) / PERCENTAGE_PRECISION_MILLION,
      })
    );

    // No update events — synthesize a starting anchor from current
    // on-chain values at activation time so the chart shows a flat line.
    if (
      events.length === 0 &&
      transcoder?.activationTimestamp &&
      transcoder?.rewardCut != null &&
      transcoder?.feeShare != null
    ) {
      events.push({
        timestamp: Number(transcoder.activationTimestamp) * 1000,
        rewardCut: Number(transcoder.rewardCut) / PERCENTAGE_PRECISION_MILLION,
        feeCut: 1 - Number(transcoder.feeShare) / PERCENTAGE_PRECISION_MILLION,
      });
    }

    if (events.length === 0) return [];

    // "Now" anchor so the chart line extends to the present day.
    const last = events[events.length - 1];
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    if (now - last.timestamp > 86_400_000) {
      events.push({
        timestamp: now,
        rewardCut: last.rewardCut,
        feeCut: last.feeCut,
      });
    }

    return events;
  }, [
    data,
    transcoder?.activationTimestamp,
    transcoder?.rewardCut,
    transcoder?.feeShare,
  ]);

  const rewardCutData = useMemo<ChartDatum[]>(
    () => points.map((d) => ({ x: d.timestamp, y: d.rewardCut })),
    [points]
  );
  const feeCutData = useMemo<ChartDatum[]>(
    () => points.map((d) => ({ x: d.timestamp, y: d.feeCut })),
    [points]
  );

  const last = points[points.length - 1];
  const baseRewardCut = last?.rewardCut ?? 0;
  const baseFeeCut = last?.feeCut ?? 0;

  return {
    rewardCutData,
    feeCutData,
    baseRewardCut,
    baseFeeCut,
    loading,
  };
}
