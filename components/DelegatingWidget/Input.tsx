import { gql, useApolloClient } from "@apollo/client";
import useWindowSize from "react-use/lib/useWindowSize";
import { Box } from "@livepeer/design-system";
import { calculateAnnualROI } from "@lib/utils";

const Input = ({ transcoder, value, onChange, protocol, ...props }) => {
  const client = useApolloClient();
  const { width } = useWindowSize();

  const pools = transcoder?.pools ?? [];
  const rewardCallRatio =
    pools.length > 0
      ? pools.filter((r) => r?.rewardTokens).length / pools.length
      : 0;

  const principle = Number(value || 0);

  const roi = calculateAnnualROI({
    successRate: Number(transcoder?.successRates?.global || 0) / 100,
    thirtyDayVolumeETH: Number(transcoder?.thirtyDayVolumeETH || 0),
    feeShare: Number(transcoder?.feeShare || 0),
    lptPriceEth: Number(protocol?.lptPriceEth || 0),

    yearlyRewardsToStakeRatio: Number(protocol?.yearlyRewardsToStakeRatio || 0),
    rewardCallRatio: rewardCallRatio,
    rewardCut: Number(transcoder?.rewardCut || 0),
    principle: principle,
    totalStake: Number(transcoder?.totalStake || 0),
  });

  client.writeQuery({
    query: gql`
      query {
        principle
        roiFees
        roiFeesLpt
        roiRewards
      }
    `,
    data: {
      principle,
      roiFeesLpt: roi.delegator.feesLpt,
      roiFees: roi.delegator.fees,
      roiRewards: roi.delegator.rewards,
    },
  });

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
          py: 0,
          pl: 0,
          pr: 6,
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
