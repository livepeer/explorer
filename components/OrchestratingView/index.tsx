import Stat from "@components/Stat";
import { Box, Flex } from "@livepeer/design-system";
import { CheckIcon, Cross1Icon } from "@modulz/radix-icons";
import dayjs from "dayjs";
import numeral from "numeral";
import Masonry from "react-masonry-css";

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const breakpointColumnsObj = {
  default: 2,
  1100: 2,
  700: 2,
  500: 1,
};

const Index = ({ currentRound, transcoder, isActive }) => {
  const callsMade = transcoder.pools.filter(
    (r) => r.rewardTokens != null
  ).length;

  console.log({ transcoder });

  return (
    <Box
      css={{
        pt: "$4",
        ".masonry-grid": {
          display: "flex",
          marginLeft: "-$3",
          width: "auto",
        },
        ".masonry-grid_column": {
          paddingLeft: "$3",
          backgroundClip: "padding-box",
        },

        ".masonry-grid_column > .masonry-grid_item": {
          marginBottom: "$3",
        },
      }}
    >
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid_column"
      >
        <Stat
          className="masonry-grid_item"
          label="Total Delegated Stake"
          tooltip={
            "The total amount of stake delegated to this orchestrator (including their own self-stake)."
          }
          value={`${numeral(transcoder?.totalStake || 0).format("0.00a")} LPT`}
        />
        <Stat
          className="masonry-grid_item"
          label="Transcoding Score"
          tooltip={
            "The average transcoding score from each Livepeer region in the past 24 hours. Note: this may be inaccurate, depending on the reliability of the testing infrastructure."
          }
          value={`${numeral(transcoder?.scores?.global || 0).format("0.0%")}`}
        />
        <Stat
          className="masonry-grid_item"
          label="Time Active"
          tooltip={
            "The amount of time the orchestrator has been active on the network."
          }
          value={`${dayjs.unix(transcoder.activationTimestamp).fromNow(true)}`}
        />
        <Stat
          className="masonry-grid_item"
          label="Reward Calls"
          tooltip={
            "The number of times this orchestrator has requested inflationary rewards over the past thirty rounds. A lower ratio than 30/30 indicates this orchestrator has missed rewards for a round."
          }
          value={`${callsMade}/${transcoder.pools.length}`}
        />
        <Stat
          className="masonry-grid_item"
          label="Earned Fees"
          tooltip={
            "The total amount of fees this orchestrator has earned (since the migration to Arbitrum One)."
          }
          value={`${numeral(transcoder?.totalVolumeETH || 0).format(
            "0.00a"
          )} ETH`}
        />
        <Stat
          className="masonry-grid_item"
          label="30d Fees"
          tooltip={
            "The amount of fees which this orchestrator has earned in the past thirty days."
          }
          value={`${numeral(transcoder?.thirtyDayVolumeETH || 0).format(
            "0.00a"
          )} ETH`}
        />
        <Stat
          className="masonry-grid_item"
          label="Total Delegators"
          tooltip={
            "The number of delegators which have delegated stake to this orchestrator."
          }
          value={`${numeral(transcoder?.delegators?.length || 0).format(
            "0,0"
          )}`}
        />
        <Stat
          className="masonry-grid_item"
          label="Reward Cut"
          tooltip={
            "The percent of the inflationary reward fees which are kept by the orchestrator, with the remainder distributed to its delegators by percent stake."
          }
          value={numeral(transcoder?.rewardCut || 0)
            .divide(1000000)
            .format("0%")}
        />
        <Stat
          className="masonry-grid_item"
          label="Fee Cut"
          tooltip={
            "The percent of the transcoding fees which are kept by the orchestrator, with the remainder distributed to its delegators by percent stake."
          }
          value={numeral(1 - (transcoder?.feeShare || 0) / 1000000).format(
            "0%"
          )}
        />

        <Stat
          className="masonry-grid_item"
          label="Price / Pixel"
          tooltip="The price for transcoding which the orchestrator is currently charging to broadcasters."
          value={`${numeral(
            (transcoder?.price || 0) <= 0 ? 0 : transcoder.price
          ).format("0,0")} WEI`}
        />
        {transcoder?.lastRewardRound?.id && (
          <Stat
            className="masonry-grid_item"
            tooltip={
              "The last round that an orchestrator received rewards while active - a checkmark indicates that reward was called for the current round."
            }
            label="Last Reward Round"
            value={
              <Flex css={{ alignItems: "center" }}>
                {transcoder.lastRewardRound.id}{" "}
                {isActive && (
                  <Flex>
                    {transcoder.lastRewardRound.id === currentRound.id ? (
                      <Box
                        as={CheckIcon}
                        css={{ fontSize: "$3", color: "$green11", ml: "$2" }}
                      />
                    ) : (
                      <Box
                        as={Cross1Icon}
                        css={{ fontSize: "$2", color: "$red11", ml: "$2" }}
                      />
                    )}
                  </Flex>
                )}
              </Flex>
            }
          />
        )}
      </Masonry>
    </Box>
  );
};

export default Index;
