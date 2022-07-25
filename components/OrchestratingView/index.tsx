import Stat from "@components/Stat";
import { Box, Flex } from "@livepeer/design-system";
import { CheckIcon, Cross1Icon } from "@modulz/radix-icons";
import dayjs from "dayjs";
import numeral from "numeral";
import Masonry from "react-masonry-css";

import { AccountQueryResult } from "apollo";
import relativeTime from "dayjs/plugin/relativeTime";
import { useScoreData } from "hooks";
import { useMemo } from "react";
import { ALL_REGIONS } from "utils/allRegions";
dayjs.extend(relativeTime);

const breakpointColumnsObj = {
  default: 2,
  1100: 2,
  700: 2,
  500: 1,
};

interface Props {
  transcoder?: AccountQueryResult["data"]["transcoder"];
  currentRound?: AccountQueryResult["data"]["protocol"]["currentRound"];
  isActive: boolean;
}

const Index = ({ currentRound, transcoder, isActive }: Props) => {
  const callsMade = useMemo(
    () => transcoder?.pools?.filter((r) => r.rewardTokens != null)?.length ?? 0,
    [transcoder?.pools]
  );

  const scores = useScoreData(transcoder?.id);

  const maxScore = useMemo(
    () =>
      Object.keys(scores?.scores ?? {}).reduce(
        (prev, curr) => {
          if (scores?.scores[curr] >= prev.score) {
            return {
              region: ALL_REGIONS[curr],
              score: scores?.scores[curr],
            };
          }
          return prev;
        },
        { region: "N/A", score: 0 }
      ),
    [scores]
  );

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
          value={
            transcoder
              ? `${numeral(transcoder?.totalStake || 0).format("0.00a")} LPT`
              : null
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Status"
          tooltip={`The status of the orchestrator on the network.`}
          value={isActive ? "Active" : "Inactive"}
        />
        <Stat
          className="masonry-grid_item"
          label="Top Regional Score"
          tooltip={`The transcoding score for the orchestrator's best operational region, ${maxScore.region}, in the past 24 hours. Note: this may be inaccurate, depending on the reliability of the testing infrastructure.`}
          value={
            scores
              ? `${numeral(maxScore.score).divide(100).format("0.0%")} (${
                  maxScore.region
                })`
              : null
          }
        />
        <Stat
          className="masonry-grid_item"
          label="Reward Calls"
          tooltip={
            "The number of times this orchestrator has requested inflationary rewards over the past thirty rounds. A lower ratio than 30/30 indicates this orchestrator has missed rewards for a round."
          }
          value={
            transcoder ? `${callsMade}/${transcoder?.pools?.length ?? 0}` : null
          }
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
          label="Price / Pixel"
          tooltip="The most recent price for transcoding which the orchestrator is currently advertising off-chain to broadcasters. This may be different from on-chain pricing."
          value={
            scores
              ? `${numeral(
                  (scores?.pricePerPixel || 0) <= 0 ? 0 : scores.pricePerPixel
                ).format("0,0")} WEI`
              : null
          }
        />
        {/* <Stat
          className="masonry-grid_item"
          label="Total Delegators"
          tooltip={
            "The number of delegators which have delegated stake to this orchestrator."
          }
          value={`${numeral(transcoder?.delegators?.length || 0).format(
            "0,0"
          )}`}
        /> */}
        <Stat
          className="masonry-grid_item"
          label="Fee Cut"
          tooltip={
            "The percent of the transcoding fees which are kept by the orchestrator, with the remainder distributed to its delegators by percent stake."
          }
          value={numeral(1 - (+transcoder?.feeShare || 0) / 1000000).format(
            "0%"
          )}
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
          label="Time Active"
          tooltip={
            "The amount of time the orchestrator has been active on the network."
          }
          value={`${
            transcoder?.activationTimestamp
              ? dayjs.unix(transcoder?.activationTimestamp).fromNow(true)
              : "N/A"
          }`}
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
