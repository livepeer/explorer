import type { ChartDatum } from "@components/ExplorerChart";
import type { AccountQueryResult } from "apollo";
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

type Transcoder = NonNullable<AccountQueryResult["data"]>["transcoder"];

export function useOrchestratorCutHistory(transcoder?: Transcoder) {
  const { data, loading } = useTranscoderUpdateEventsQuery({
    variables: {
      where: {
        delegate: transcoder?.id,
      },
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
        rewardCut: Number(event.rewardCut) / 1000000,
        feeCut: 1 - Number(event.feeShare) / 1000000,
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
        rewardCut: Number(transcoder.rewardCut) / 1000000,
        feeCut: 1 - Number(transcoder.feeShare) / 1000000,
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
