import { abbreviateNumber } from "@lib/utils";
import { Box, Flex, Tooltip } from "@livepeer/design-system";
import Stat from "@components/Stat";
import {
  CheckIcon,
  Cross1Icon,
  QuestionMarkCircledIcon,
} from "@modulz/radix-icons";

const Index = ({ currentRound, transcoder }) => {
  const callsMade = transcoder.pools.filter(
    (r) => r.rewardTokens != null
  ).length;
  const active =
    transcoder?.activationRound <= currentRound.id &&
    transcoder?.deactivationRound > currentRound.id;

  return (
    <Box css={{ pt: "$4" }}>
      <Box
        css={{
          display: "grid",
          gridGap: "$3",
          gridTemplateColumns: "repeat(auto-fit, minmax(33%, 1fr))",
          "@bp3": {
            gridTemplateColumns: "repeat(auto-fit, minmax(30%, 1fr))",
          },
        }}
      >
        <Stat
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
        <Stat
          label="Reward Calls"
          value={`${callsMade}/${transcoder.pools.length}`}
        />
        <Stat
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
      </Box>
    </Box>
  );
};

export default Index;
