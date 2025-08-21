import { calculateROI } from "@lib/roi";
import { Box } from "@livepeer/design-system";
import { useExplorerStore } from "hooks";
import { useEffect, useMemo } from "react";
import { useWindowSize } from "react-use";

const Input = ({ transcoder, value, onChange, protocol, treasury, ...props }) => {
  const { width } = useWindowSize();

  const pools = useMemo(() => transcoder?.pools ?? [], [transcoder]);
  const rewardCallRatio = useMemo(
    () =>
      pools.length > 0
        ? pools.filter((r) => r?.rewardTokens).length / pools.length
        : 0,
    [pools]
  );

  const principle = useMemo(() => Number(value || 0), [value]);

  const roi = useMemo(
    () =>
      calculateROI({
        inputs: {
          principle,
        },
        orchestratorParams: {
          totalStake: Number(transcoder.totalStake),
        },
        feeParams: {
          ninetyDayVolumeETH: Number(transcoder.ninetyDayVolumeETH),
          feeShare: Number(transcoder.feeShare) / 1000000,
          lptPriceEth: Number(protocol.lptPriceEth),
        },
        rewardParams: {
          inflation: Number(protocol.inflation) / 1000000000,
          inflationChangePerRound:
            Number(protocol.inflationChange) / 1000000000,
          totalSupply: Number(protocol.totalSupply),
          totalActiveStake: Number(protocol.totalActiveStake),
          roundLength: Number(protocol.roundLength),

          rewardCallRatio,
          rewardCut: Number(transcoder.rewardCut) / 1000000,
          treasuryRewardCut: treasury.treasuryRewardCutRate,
        },
      }),
    [protocol, transcoder, principle, rewardCallRatio, treasury.treasuryRewardCutRate]
  );

  const { setYieldResults } = useExplorerStore();

  useEffect(() => {
    setYieldResults({
      principle,
      roiFeesLpt: roi.delegator.feesLpt,
      roiFees: roi.delegator.fees,
      roiRewards: roi.delegator.rewards,
    });
  }, [setYieldResults, principle, roi.delegator]);

  return (
    <Box
      css={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        position: "relative",
      }}
      {...props}
    >
      <Box
        as="input"
        placeholder="0.0"
        type="number"
        min="0"
        step="any"
        autoFocus={width > 1020}
        value={value}
        onChange={onChange}
        css={{
          backgroundColor: "transparent",
          borderTop: 0,
          borderLeft: 0,
          borderRight: 0,
          borderBottom: 0,
          color: "$text",
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 0,
          paddingRight: 6,
          boxShadow: "none",
          width: "100%",
          outline: "none",
          fontSize: "$5",
          fontFamily: "$monospace",
          "&::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
          },
          "&::-webkit-outer-spin-button": {
            WebkitAppearance: "none",
          },
        }}
      />
      <Box css={{ fontSize: "$2", right: 0, position: "absolute" }}>LPT</Box>
    </Box>
  );
};

export default Input;
