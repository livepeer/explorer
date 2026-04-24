import type { ChartDatum } from "@components/ExplorerChart";
import type { AccountQueryResult } from "apollo";
import {
  OrderDirection,
  TranscoderUpdateEvent_OrderBy,
  useTranscoderUpdateEventsQuery,
} from "apollo";
import { useMemo } from "react";

export type CutDataPoint = {
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

  const chartData = useMemo<CutDataPoint[]>(() => {
    const events: CutDataPoint[] = (data?.transcoderUpdateEvents ?? []).map(
      (event) => ({
        timestamp: event.timestamp,
        rewardCut: (Number(event.rewardCut) / 1000000) * 100,
        feeCut: (1 - Number(event.feeShare) / 1000000) * 100,
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
        timestamp: Number(transcoder.activationTimestamp),
        rewardCut: (Number(transcoder.rewardCut) / 1000000) * 100,
        feeCut: (1 - Number(transcoder.feeShare) / 1000000) * 100,
      });
    }

    if (events.length === 0) return [];

    // "Now" anchor so the chart line extends to the present day.
    const last = events[events.length - 1];
    // eslint-disable-next-line react-hooks/purity
    const now = Math.floor(Date.now() / 1000);
    if (now - last.timestamp > 86400) {
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

  // ExplorerChart's percent unit expects decimals (0.05 = 5%).
  const rewardCutData = useMemo<ChartDatum[]>(
    () => chartData.map((d) => ({ x: d.timestamp, y: d.rewardCut / 100 })),
    [chartData]
  );
  const feeCutData = useMemo<ChartDatum[]>(
    () => chartData.map((d) => ({ x: d.timestamp, y: d.feeCut / 100 })),
    [chartData]
  );

  const baseRewardCut = chartData.length
    ? chartData[chartData.length - 1].rewardCut / 100
    : 0;
  const baseFeeCut = chartData.length
    ? chartData[chartData.length - 1].feeCut / 100
    : 0;

  return {
    chartData,
    rewardCutData,
    feeCutData,
    baseRewardCut,
    baseFeeCut,
    loading,
  };
}
