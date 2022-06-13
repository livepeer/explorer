import { gql, useQuery } from "@apollo/client";
import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Spinner from "@components/Spinner";
import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import { Box, Flex, Text, themes } from "@livepeer/design-system";
import {
  CheckIcon,
  Cross1Icon,
  QuestionMarkCircledIcon,
} from "@modulz/radix-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTheme } from "next-themes";
import numeral from "numeral";
import { useEffect, useMemo } from "react";
import { buildStyles } from "react-circular-progressbar";
import { usePageVisibility } from "../../hooks";
import CircularProgressbar from "../CircularProgressBar";

dayjs.extend(relativeTime);

const Index = () => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme?.includes("-")
    ? themes[resolvedTheme]
    : themes[`${resolvedTheme}-theme-green`];
  const isVisible = usePageVisibility();
  const pollInterval = 30000;

  const {
    data: protocolData,
    loading: protocolDataloading,
    startPolling: startPollingProtocol,
    stopPolling: stopPollingProtocol,
  } = useQuery(
    gql`
      {
        protocol(id: "0") {
          id
          roundLength
          lockPeriod
          currentRound {
            id
            mintableTokens
            volumeETH
            volumeUSD
            pools {
              rewardTokens
            }
          }
        }
      }
    `,
    {
      pollInterval,
    }
  );
  const {
    data: blockData,
    loading: blockDataLoading,
    startPolling: startPollingBlock,
    stopPolling: stopPollingBlock,
  } = useQuery(
    gql`
      {
        l1Block
      }
    `,
    {
      pollInterval,
    }
  );

  const {
    data: currentRoundInfo,
    loading: currentRoundInfoLoading,
    startPolling: startPollingCurrentRoundInfo,
    stopPolling: stopPollingCurrentRoundInfo,
  } = useQuery(
    gql`
      {
        currentRoundInfo
      }
    `,
    {
      pollInterval,
    }
  );

  useEffect(() => {
    if (!isVisible) {
      stopPollingProtocol();
      stopPollingBlock();
      stopPollingCurrentRoundInfo();
    } else {
      startPollingProtocol(pollInterval);
      startPollingBlock(pollInterval);
      startPollingCurrentRoundInfo(pollInterval);
    }
  }, [
    isVisible,
    stopPollingProtocol,
    stopPollingBlock,
    stopPollingCurrentRoundInfo,
    startPollingProtocol,
    startPollingBlock,
    startPollingCurrentRoundInfo,
  ]);

  const blocksRemaining = useMemo(
    () =>
      currentRoundInfo?.currentRoundInfo?.initialized &&
      blockData &&
      protocolData
        ? +protocolData.protocol.roundLength -
          (+blockData.l1Block.number -
            +currentRoundInfo.currentRoundInfo.startBlock)
        : 0,
    [protocolData, blockData, currentRoundInfo]
  );
  const timeRemaining = useMemo(
    () => AVERAGE_L1_BLOCK_TIME * blocksRemaining,
    [blocksRemaining]
  );
  const blocksSinceCurrentRoundStart = useMemo(
    () =>
      currentRoundInfo?.currentRoundInfo?.initialized && blockData
        ? +blockData.l1Block.number -
          +currentRoundInfo.currentRoundInfo.startBlock
        : 0,
    [currentRoundInfo, blockData]
  );

  const percentage = useMemo(
    () =>
      protocolData
        ? (blocksSinceCurrentRoundStart / +protocolData.protocol.roundLength) *
          100
        : 0,
    [blocksSinceCurrentRoundStart, protocolData]
  );

  const isRoundLocked = useMemo(
    () =>
      protocolData && currentRoundInfo
        ? blocksRemaining <= Number(protocolData?.protocol?.lockPeriod)
        : false,
    [protocolData, blocksRemaining, currentRoundInfo]
  );

  const rewardTokensClaimed = useMemo(
    () =>
      protocolData?.protocol?.currentRound?.pools?.reduce(
        (prev, pool) => prev + Number(pool?.rewardTokens || 0),
        0
      ) || 0,
    [protocolData]
  );

  return (
    <Box
      css={{
        minWidth: 250,
        width: "100%",
      }}
    >
      <Flex css={{ width: "100%", justifyContent: "space-between" }}>
        <Box>
          <Text
            css={{
              fontWeight: 600,
              fontSize: "$2",
              color: "white",
            }}
          >
            Current Round
          </Text>

          <Text
            css={{
              fontWeight: 600,
              fontSize: "$3",
              color: "white",
            }}
          >
            {currentRoundInfo?.currentRoundInfo?.id
              ? `#${currentRoundInfo.currentRoundInfo.id}`
              : ""}
          </Text>
        </Box>
        <ExplorerTooltip
          multiline
          content={
            <Box>
              {!isRoundLocked
                ? "The current round is ongoing and orchestrators can currently update their parameters."
                : "The current round is locked, which means that orchestrator parameters cannot be updated until the next round begins."}
            </Box>
          }
        >
          <Flex>
            <Text
              css={{
                fontWeight: 600,
                fontSize: "$2",
                color: "white",
              }}
            >
              {!isRoundLocked ? "Initialized " : "Locked "}
            </Text>

            {isRoundLocked ? (
              <Box
                as={Cross1Icon}
                css={{ ml: "$2", width: 20, height: 20, color: "$red11" }}
              />
            ) : (
              <Box
                as={CheckIcon}
                css={{ ml: "$1", width: 20, height: 20, color: "$primary11" }}
              />
            )}
          </Flex>
        </ExplorerTooltip>
      </Flex>

      <Box
        css={{
          width: "100%",
          mt: "$2",
        }}
      >
        {!currentRoundInfo || !protocolData ? (
          <Flex
            css={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spinner />
          </Flex>
        ) : currentRoundInfo?.currentRoundInfo?.initialized ? (
          <Flex
            css={{
              pb: "$2",
              alignItems: "center",
              flexDirection: "column",
            }}
          >
            <Box
              css={{
                width: 160,
                minWidth: 160,
                height: 160,
                minHeight: 160,
                mb: "$4",
                display: "block",
              }}
            >
              <Box
                as={CircularProgressbar}
                strokeWidth={6}
                styles={buildStyles({
                  strokeLinecap: "butt",
                  pathColor: theme.colors.primary11,
                  textColor: theme.colors.black,
                  trailColor: theme.colors.neutral7,
                })}
                value={Math.round(percentage)}
              >
                <Box css={{ textAlign: "center" }}>
                  <Box css={{ fontWeight: "bold", fontSize: "$5" }}>
                    {blocksSinceCurrentRoundStart}
                  </Box>
                  <Box css={{ fontSize: "$1" }}>
                    of {protocolData.protocol.roundLength} blocks
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box css={{ lineHeight: 1.5 }}>
              <Text css={{ fontSize: "$2" }}>
                There are{" "}
                <Box
                  as="span"
                  css={{
                    fontWeight: "bold",
                  }}
                >
                  {blocksRemaining} blocks
                </Box>{" "}
                and approximately{" "}
                <Box
                  as="span"
                  css={{
                    fontWeight: "bold",
                  }}
                >
                  {dayjs().add(timeRemaining, "seconds").fromNow(true)}
                </Box>{" "}
                remaining until the current round ends and round{" "}
                <Box
                  as="span"
                  css={{
                    fontWeight: "bold",
                  }}
                >
                  #{+currentRoundInfo.currentRoundInfo.id + 1}
                </Box>{" "}
                begins.
              </Text>
            </Box>
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  The amount of fees that have been paid out in the current
                  round. Equivalent to{" "}
                  {numeral(
                    protocolData?.protocol?.currentRound?.volumeUSD || 0
                  ).format("$0,0k")}{" "}
                  at recent prices of ETH.
                </Box>
              }
            >
              <Flex
                css={{
                  mt: "$3",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Flex
                  css={{
                    alignItems: "center",
                  }}
                >
                  <Text
                    css={{
                      fontSize: "$2",
                    }}
                    variant="neutral"
                  >
                    Fees
                  </Text>
                  <Box css={{ ml: "$1" }}>
                    <QuestionMarkCircledIcon />
                  </Box>
                </Flex>

                <Text
                  css={{
                    fontSize: "$2",
                    color: "white",
                  }}
                >
                  {numeral(
                    protocolData?.protocol?.currentRound?.volumeETH || 0
                  ).format("0.0")}{" "}
                  ETH
                </Text>
              </Flex>
            </ExplorerTooltip>
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  The amount of rewards which have been claimed by orchestrators
                  in the current round.
                </Box>
              }
            >
              <Flex
                css={{
                  mt: "$1",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Flex
                  css={{
                    alignItems: "center",
                  }}
                >
                  <Text
                    css={{
                      fontSize: "$2",
                    }}
                    variant="neutral"
                  >
                    Rewards
                  </Text>
                  <Box css={{ ml: "$1" }}>
                    <QuestionMarkCircledIcon />
                  </Box>
                </Flex>

                <Text
                  css={{
                    fontSize: "$2",
                    color: "white",
                  }}
                >
                  {numeral(rewardTokensClaimed).format("0")}/
                  {numeral(
                    protocolData?.protocol?.currentRound?.mintableTokens || 0
                  ).format("0")}{" "}
                  LPT
                </Text>
              </Flex>
            </ExplorerTooltip>
          </Flex>
        ) : (
          <Text
            css={{
              fontWeight: 600,
              fontSize: "$3",
              color: "white",
            }}
          >
            The current round has not yet been initialized.
          </Text>
        )}
      </Box>
    </Box>
  );
};

export default Index;
