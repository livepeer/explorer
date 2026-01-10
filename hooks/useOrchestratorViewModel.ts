import { bondingManager } from "@lib/api/abis/main/BondingManager";
import dayjs from "@lib/dayjs";
import {
  calculateROI,
  ROIFactors,
  ROIInflationChange,
  ROITimeHorizon,
} from "@lib/roi";
import { OrchestratorsQueryResult, ProtocolQueryResult } from "apollo";
import { useBondingManagerAddress } from "hooks/useContracts";
import numbro from "numbro";
import { useCallback, useMemo, useState } from "react";
import { useReadContract } from "wagmi";

type UseOrchestratorViewModelParams = {
  data:
    | NonNullable<OrchestratorsQueryResult["data"]>["transcoders"]
    | undefined;
  protocolData:
    | NonNullable<ProtocolQueryResult["data"]>["protocol"]
    | undefined;
};

export function useOrchestratorViewModel({
  data,
  protocolData,
}: UseOrchestratorViewModelParams) {
  // Filter state
  const [principle, setPrinciple] = useState<number>(150);
  const [inflationChange, setInflationChange] =
    useState<ROIInflationChange>("none");
  const [factors, setFactors] = useState<ROIFactors>("lpt+eth");
  const [timeHorizon, setTimeHorizon] = useState<ROITimeHorizon>("one-year");

  // Derived values
  const maxSupplyTokens = useMemo(
    () => Math.floor(Number(protocolData?.totalSupply || 1e7)),
    [protocolData]
  );

  const formattedPrinciple = useMemo(
    () =>
      numbro(Number(principle) || 150).format({ mantissa: 0, average: true }),
    [principle]
  );

  const formatPercentChange = useCallback(
    (change: ROIInflationChange) =>
      change === "none"
        ? `Fixed at ${numbro(
            Number(protocolData?.inflation) / 1000000000
          ).format({
            mantissa: 3,
            output: "percent",
          })}`
        : `${numbro(Number(protocolData?.inflationChange) / 1000000000).format({
            mantissa: 5,
            output: "percent",
            forceSign: true,
          })} per round`,
    [protocolData?.inflation, protocolData?.inflationChange]
  );

  // Contract data
  const { data: bondingManagerAddress } = useBondingManagerAddress();
  const { data: treasuryRewardCutRate = BigInt(0.0) } = useReadContract({
    query: { enabled: Boolean(bondingManagerAddress) },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "treasuryRewardCutRate",
  });

  // Computed data
  const mappedData =
    useMemo(() => {
      if (!data) return [];
      return data
        .map((row) => {
          const pools = row.pools ?? [];
          const rewardCalls =
            pools.length > 0 ? pools.filter((r) => r?.rewardTokens).length : 0;
          const rewardCallRatio = rewardCalls / pools.length;

          const activation = dayjs.unix(row.activationTimestamp);

          const isNewlyActive = dayjs().diff(activation, "days") < 45;

          const feeShareDaysSinceChange = dayjs().diff(
            dayjs.unix(row.feeShareUpdateTimestamp),
            "days"
          );
          const rewardCutDaysSinceChange = dayjs().diff(
            dayjs.unix(row.rewardCutUpdateTimestamp),
            "days"
          );

          const roi = calculateROI({
            inputs: {
              principle: Number(principle),
              timeHorizon,
              inflationChange,
              factors,
            },
            orchestratorParams: {
              totalStake: Number(row.totalStake),
            },
            feeParams: {
              ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
              feeShare: Number(row.feeShare) / 1000000,
              lptPriceEth: Number(protocolData?.lptPriceEth),
            },
            rewardParams: {
              inflation: Number(protocolData?.inflation) / 1000000000,
              inflationChangePerRound:
                Number(protocolData?.inflationChange) / 1000000000,
              totalSupply: Number(protocolData?.totalSupply),
              totalActiveStake: Number(protocolData?.totalActiveStake),
              roundLength: Number(protocolData?.roundLength),

              rewardCallRatio,
              rewardCut: Number(row.rewardCut) / 1000000,
              treasuryRewardCut:
                Number(treasuryRewardCutRate / BigInt(1e18)) / 1e9,
            },
          });

          return {
            ...row,
            daysSinceChangeParams:
              (feeShareDaysSinceChange < rewardCutDaysSinceChange
                ? feeShareDaysSinceChange
                : rewardCutDaysSinceChange) ?? 0,
            daysSinceChangeParamsFormatted:
              (feeShareDaysSinceChange < rewardCutDaysSinceChange
                ? dayjs.unix(row.feeShareUpdateTimestamp).fromNow()
                : dayjs.unix(row.rewardCutUpdateTimestamp).fromNow()) ?? "",
            earningsComputed: {
              roi,
              activation,
              isNewlyActive,
              rewardCalls,
              rewardCallLength: pools.length,
              rewardCallRatio,
              feeShare: row.feeShare,
              rewardCut: row.rewardCut,
              ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
              totalActiveStake: Number(protocolData?.totalActiveStake),
              totalStake: Number(row.totalStake),
            },
          };
        })
        .sort((a, b) =>
          a.earningsComputed.isNewlyActive
            ? 1
            : b.earningsComputed.isNewlyActive
            ? -1
            : a.earningsComputed.roi.delegatorPercent.fees +
                a.earningsComputed.roi.delegatorPercent.rewards >
              b.earningsComputed.roi.delegatorPercent.fees +
                b.earningsComputed.roi.delegatorPercent.rewards
            ? -1
            : 1
        );
    }, [
      data,
      inflationChange,
      protocolData,
      principle,
      timeHorizon,
      factors,
      treasuryRewardCutRate,
    ]) ?? [];

  return {
    // Filter state
    filters: {
      principle,
      timeHorizon,
      factors,
      inflationChange,
    },
    // Filter setters
    setPrinciple,
    setTimeHorizon,
    setFactors,
    setInflationChange,
    // Computed data
    mappedData,
    // Derived values
    formattedPrinciple,
    maxSupplyTokens,
    formatPercentChange,
  };
}
