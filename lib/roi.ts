import { AVERAGE_L1_BLOCK_TIME } from "lib/chains";

const SECONDS_IN_A_MONTH = 2628000;

export type ROIInflationChange = "none" | "positive" | "negative";

export type ROIFactors = "lpt+eth" | "lpt" | "eth";

export type ROITimeHorizon =
  | "half-year"
  | "one-year"
  | "two-years"
  | "three-years"
  | "four-years";

export type ROIParams = {
  inputs: {
    principle: number;
    timeHorizon?: ROITimeHorizon;
    inflationChange?: ROIInflationChange;
    factors?: ROIFactors;
  };
  orchestratorParams: { totalStake: number };
  feeParams: {
    ninetyDayVolumeETH: number;
    feeShare: number;
    lptPriceEth: number;
  };
  rewardParams: {
    inflation: number;
    inflationChangePerRound: number;
    totalSupply: number;
    totalActiveStake: number;
    roundLength: number;

    rewardCallRatio: number;
    rewardCut: number;
    treasuryRewardCut: number;
  };
};

export const getMonthsForTimeHorizon = (timeHorizon: ROITimeHorizon) =>
  timeHorizon === "one-year"
    ? 12
    : timeHorizon === "half-year"
    ? 6
    : timeHorizon === "two-years"
    ? 24
    : timeHorizon === "three-years"
    ? 36
    : timeHorizon === "four-years"
    ? 48
    : 12;

export function calculateROI({
  inputs: {
    principle,
    timeHorizon = "one-year",
    inflationChange = "none",
    factors = "lpt+eth",
  },
  orchestratorParams: { totalStake },
  feeParams: { ninetyDayVolumeETH, feeShare, lptPriceEth },
  rewardParams: {
    inflation,
    inflationChangePerRound,
    totalSupply,
    totalActiveStake,
    roundLength,

    rewardCallRatio,
    rewardCut,
    treasuryRewardCut,
  },
}: ROIParams) {
  const combinedTotalStaked = principle + totalStake;

  let percentLptRewards = 0;
  let delegatorLptRewards = 0;
  let totalLptRewards = 0;

  const monthsForTimeHorizon = getMonthsForTimeHorizon(timeHorizon);

  const averageSecondsPerRound = roundLength * AVERAGE_L1_BLOCK_TIME;
  const roundsCount = Math.round(
    (monthsForTimeHorizon * SECONDS_IN_A_MONTH) / averageSecondsPerRound
  );

  // Subtract treasury reward cut from the inflation.
  inflation = inflation * (1 - treasuryRewardCut);

  let totalInflationPercent =
    (inflationChange !== "none"
      ? // 1 * (1 + rate1)(1 + rate1 +- inflationChange)(1 + rate1 +- 2*inflationChange)...
        [...Array(roundsCount)].reduce((prev, _curr, index) => {
          const roundInflationRate =
            inflation +
            inflationChangePerRound *
              index *
              (inflationChange === "negative" ? -1 : 1);
          return prev * (1 + roundInflationRate);
        }, 1)
      : Math.pow(1 + inflation, roundsCount)) - 1;

  // cap the lowest inflation at 0%
  totalInflationPercent = totalInflationPercent < 0 ? 0 : totalInflationPercent;

  if (rewardCallRatio > 0 && factors !== "eth") {
    const totalProtocolRewards = totalSupply * totalInflationPercent;
    const totalProtocolRewardRatio = totalProtocolRewards / totalActiveStake;

    const expectedTotalYearlyRewards =
      totalProtocolRewardRatio * (combinedTotalStaked * rewardCallRatio);
    const expectedDelegatorYearlyRewards =
      expectedTotalYearlyRewards *
      (1 - rewardCut) *
      (principle / combinedTotalStaked);

    totalLptRewards = expectedTotalYearlyRewards;
    delegatorLptRewards = expectedDelegatorYearlyRewards;
    percentLptRewards = expectedDelegatorYearlyRewards / principle;
  }

  let percentExpectedLptFeeCutDelegator = 0;
  let delegatorFees = 0;
  let delegatorLptFees = 0;
  let totalFees = 0;

  if (ninetyDayVolumeETH > 0 && factors !== "lpt") {
    const expectedPeriodVolumeEth =
      (ninetyDayVolumeETH / 90) * 365 * (monthsForTimeHorizon / 12);
    const expectedPeriodEthCutDelegators = expectedPeriodVolumeEth * feeShare;
    const expectedPeriodFeeCutDelegator =
      expectedPeriodEthCutDelegators * (principle / combinedTotalStaked);

    const expectedLptFeeCutDelegator =
      expectedPeriodFeeCutDelegator / lptPriceEth;

    totalFees = expectedPeriodVolumeEth;
    delegatorFees = expectedPeriodFeeCutDelegator;
    delegatorLptFees = expectedLptFeeCutDelegator;
    percentExpectedLptFeeCutDelegator = expectedLptFeeCutDelegator / principle;
  }

  return {
    delegatorPercent: {
      fees: percentExpectedLptFeeCutDelegator,
      rewards: percentLptRewards,
    },
    delegator: {
      fees: delegatorFees,
      feesLpt: delegatorLptFees,
      rewards: delegatorLptRewards,
    },
    total: {
      fees: totalFees,
      rewards: totalLptRewards,
    },
    params: {
      roundsCount,
      averageSecondsPerRound,
      totalInflationPercent,
    },
  };
}
