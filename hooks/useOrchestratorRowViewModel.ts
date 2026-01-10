import numbro from "numbro";
import { useMemo } from "react";

type EarningsData = {
  feeShare: number | string;
  rewardCut: number | string;
  rewardCalls: number;
  rewardCallLength: number;
  isNewlyActive: boolean;
};

export function useOrchestratorRowViewModel(earnings: EarningsData) {
  const feeCut = useMemo(
    () =>
      numbro(1 - Number(earnings.feeShare) / 1000000).format({
        mantissa: 0,
        output: "percent",
      }),
    [earnings.feeShare]
  );

  const rewardCut = useMemo(
    () =>
      numbro(Number(earnings.rewardCut) / 1000000).format({
        mantissa: 0,
        output: "percent",
      }),
    [earnings.rewardCut]
  );

  const rewardCalls = useMemo(
    () =>
      `${numbro(earnings.rewardCalls)
        .divide(earnings.rewardCallLength)
        .format({ mantissa: 0, output: "percent" })}`,
    [earnings.rewardCalls, earnings.rewardCallLength]
  );

  return {
    feeCut,
    rewardCut,
    rewardCalls,
    isNewlyActive: earnings.isNewlyActive,
  };
}
