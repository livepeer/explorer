import {
  OrderDirection,
  TranscoderUpdateEvent_OrderBy,
  useTranscoderUpdateEventsQuery,
} from "apollo";
import { useMemo } from "react";

// Only flag increases that hurt delegators (orch taking more).
// Decreases are good for delegators and should not trigger warnings.
const MALICIOUS_INCREASE_THRESHOLD = 50; // 50+ percentage point increase in one change

type CutDataPoint = {
  timestamp: number;
  rewardCut: number;
  feeCut: number;
};

type Warning = {
  message: string;
} | null;

export function useRewardCutHistory(transcoderId?: string) {
  const { data, loading } = useTranscoderUpdateEventsQuery({
    variables: {
      where: {
        delegate: transcoderId,
      },
      first: 1000,
      orderBy: TranscoderUpdateEvent_OrderBy.Timestamp,
      orderDirection: OrderDirection.Asc,
    },
    skip: !transcoderId,
  });

  const chartData = useMemo<CutDataPoint[]>(() => {
    if (!data?.transcoderUpdateEvents?.length) return [];
    const events = data.transcoderUpdateEvents.map((event) => ({
      timestamp: event.timestamp,
      rewardCut: (Number(event.rewardCut) / 1000000) * 100,
      feeCut: (1 - Number(event.feeShare) / 1000000) * 100,
    }));

    // Add a "now" anchor point with the most recent values so the chart
    // extends to the present day instead of ending at the last change
    const last = events[events.length - 1];
    const now = Math.floor(Date.now() / 1000);
    if (now - last.timestamp > 86400) {
      events.push({
        timestamp: now,
        rewardCut: last.rewardCut,
        feeCut: last.feeCut,
      });
    }

    return events;
  }, [data]);

  const warning = useMemo<Warning>(() => {
    if (chartData.length < 2) return null;

    let worstRewardIncrease = 0;
    let worstFeeIncrease = 0;

    for (let i = 1; i < chartData.length; i++) {
      // Positive = increase = bad for delegators
      const rewardIncrease =
        chartData[i].rewardCut - chartData[i - 1].rewardCut;
      const feeIncrease = chartData[i].feeCut - chartData[i - 1].feeCut;

      worstRewardIncrease = Math.max(worstRewardIncrease, rewardIncrease);
      worstFeeIncrease = Math.max(worstFeeIncrease, feeIncrease);
    }

    if (
      worstRewardIncrease >= MALICIOUS_INCREASE_THRESHOLD ||
      worstFeeIncrease >= MALICIOUS_INCREASE_THRESHOLD
    ) {
      return {
        message:
          "This orchestrator has a history of making large increases to their cut percentages. This may indicate a bait-and-switch strategy. Review the chart below before delegating.",
      };
    }

    return null;
  }, [chartData]);

  return { chartData, loading, warning };
}
