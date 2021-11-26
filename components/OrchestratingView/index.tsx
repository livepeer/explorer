import { abbreviateNumber } from "@lib/utils";
import { Box, Flex, Tooltip } from "@livepeer/design-system";
import Stat from "@components/Stat";
import {
  CheckIcon,
  Cross1Icon,
  QuestionMarkCircledIcon,
} from "@modulz/radix-icons";
import Masonry from "react-masonry-css";

const Index = ({ currentRound, transcoder }) => {
  const callsMade = transcoder.pools.filter(
    (r) => r.rewardTokens != null
  ).length;
  const active =
    transcoder?.activationRound <= currentRound.id &&
    transcoder?.deactivationRound > currentRound.id;

  const breakpointColumnsObj = {
    default: 2,
    1100: 2,
    700: 2,
    500: 1,
  };

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
          label="Total Stake"
          value={
            <>
              {abbreviateNumber(transcoder.totalStake, 4)}
              <Box as="span" css={{ ml: "$2" }}>
                LPT
              </Box>
            </>
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Status"
          value={active ? "Active" : "Inactive"}
        />
        <Stat
          className="masonry-grid_item"
          label="Earned Fees"
          value={
            <>
              {transcoder.totalVolumeETH
                ? abbreviateNumber(transcoder.totalVolumeETH, 3)
                : 0}
              <Box as="span" css={{ ml: "$2" }}>
                ETH
              </Box>
            </>
          }
        />
        {/* <Stat
          className="masonry-grid_item"
          label="Total Delegators"
          value={transcoder.delegators.length}
        /> */}
        <Stat
          className="masonry-grid_item"
          label="Reward Calls"
          value={`${callsMade}/${transcoder.pools.length}`}
        />
        <Stat
          className="masonry-grid_item"
          label="Reward Cut"
          value={
            <>
              {!transcoder.rewardCut
                ? 0
                : parseInt(transcoder.rewardCut, 10) / 10000}
              %
            </>
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Fee Cut"
          value={
            <>
              {
                +(
                  !transcoder.feeShare
                    ? 0
                    : 100 - parseInt(transcoder.feeShare, 10) / 10000
                ).toFixed(5)
              }
              %
            </>
          }
        />

        <Stat
          className="masonry-grid_item"
          label={
            <Flex css={{ ai: "center" }}>
              <Box>Price / Pixel</Box>
              <Tooltip
                multiline
                content={
                  <Box>
                    Price of transcoding per pixel orchestrator is charging
                  </Box>
                }
              >
                <Flex css={{ ml: "$1" }}>
                  <QuestionMarkCircledIcon />
                </Flex>
              </Tooltip>
            </Flex>
          }
          value={
            <>
              {transcoder.price <= 0 ? (
                "N/A"
              ) : (
                <Box>{transcoder.price.toLocaleString()} WEI</Box>
              )}
            </>
          }
        />
        {transcoder?.lastRewardRound?.id && (
          <Stat
            className="masonry-grid_item"
            label={
              <Flex css={{ ai: "center" }}>
                <Box>Last Reward Round</Box>
                <Tooltip
                  multiline
                  content={
                    <Box>
                      The last round that an orchestrator received rewards while
                      active. A checkmark indicates it called reward for the
                      current round.
                    </Box>
                  }
                >
                  <Flex css={{ ml: "$1" }}>
                    <QuestionMarkCircledIcon />
                  </Flex>
                </Tooltip>
              </Flex>
            }
            value={
              <Flex css={{ alignItems: "center" }}>
                {transcoder.lastRewardRound.id}{" "}
                {active && (
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
