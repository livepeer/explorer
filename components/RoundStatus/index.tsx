import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Spinner from "@components/Spinner";
import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import dayjs from "@lib/dayjs";
import { Box, Flex, getThemes, Skeleton, Text } from "@livepeer/design-system";
import {
  CheckIcon,
  Cross1Icon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import {
  formatETH,
  formatLPT,
  formatNumber,
  formatPercent,
  formatUSD,
} from "@utils/numberFormatters";
import { ProtocolQueryResult } from "apollo";
import { useCurrentRoundData, useSupplyChangeData } from "hooks";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { buildStyles } from "react-circular-progressbar";

import CircularProgressbar from "../CircularProgressBar";

const themes = getThemes();

const Index = ({
  protocol,
}: {
  protocol: NonNullable<ProtocolQueryResult["data"]>["protocol"];
}) => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme?.includes("-")
    ? themes[resolvedTheme]
    : themes[`${resolvedTheme}-theme-green`];

  const currentRoundInfo = useCurrentRoundData();

  // A round runs past its nominal end until an orchestrator calls
  // initializeRound(), so elapsed blocks can exceed the round length.
  const roundLength = currentRoundInfo?.roundLength ?? 0;
  const blocksElapsed = currentRoundInfo?.initialized
    ? currentRoundInfo.currentL1Block - currentRoundInfo.startBlock
    : 0;
  const blocksRemaining = Math.max(roundLength - blocksElapsed, 0);
  const blocksOverdue = Math.max(blocksElapsed - roundLength, 0);
  const isOverdue = roundLength > 0 && blocksElapsed >= roundLength;
  const timeRemaining = AVERAGE_L1_BLOCK_TIME * blocksRemaining;
  const timeOverdue = AVERAGE_L1_BLOCK_TIME * blocksOverdue;
  const blocksElapsedDisplay = roundLength - blocksRemaining;
  const percentage =
    roundLength > 0 ? (blocksElapsedDisplay / roundLength) * 100 : 0;

  const isRoundLocked = currentRoundInfo?.locked ?? false;

  const rewardTokensClaimed = useMemo(
    () =>
      protocol?.currentRound?.pools?.reduce(
        (prev, pool) => prev + Number(pool?.rewardTokens || 0),
        0
      ) || 0,
    [protocol]
  );

  const rewards = `${formatNumber(rewardTokensClaimed, {
    precision: 0,
  })} / ${formatNumber(Number(protocol?.currentRound?.mintableTokens), {
    precision: 0,
  })} LPT`;

  const totalSupply = useMemo(
    () => (protocol?.totalSupply ? Number(protocol.totalSupply) : null),
    [protocol]
  );
  const { data: supplyChangeData, isLoading: isSupplyChangeLoading } =
    useSupplyChangeData();

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
            {currentRoundInfo?.id ? `#${currentRoundInfo.id}` : ""}
          </Text>
        </Box>
        {!currentRoundInfo ? (
          <Skeleton css={{ height: 20, width: 90 }} />
        ) : (
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
                  css={{
                    marginLeft: "$2",
                    width: 20,
                    height: 20,
                    color: "$red11",
                  }}
                />
              ) : (
                <Box
                  as={CheckIcon}
                  css={{
                    marginLeft: "$1",
                    width: 20,
                    height: 20,
                    color: "$primary11",
                  }}
                />
              )}
            </Flex>
          </ExplorerTooltip>
        )}
      </Flex>

      <Box
        css={{
          width: "100%",
          marginTop: "$2",
        }}
      >
        {!currentRoundInfo ? (
          <Flex
            css={{
              width: "100%",
              minHeight: 240,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spinner />
          </Flex>
        ) : currentRoundInfo?.initialized ? (
          <Flex
            css={{
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
                marginBottom: "$4",
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
                    {blocksElapsedDisplay}
                  </Box>
                  <Box css={{ fontSize: "$1" }}>of {roundLength} blocks</Box>
                </Box>
              </Box>
            </Box>
            <Box css={{ lineHeight: 1.5, minHeight: 78 }}>
              {isOverdue ? (
                <Text css={{ fontSize: "$2" }}>
                  Round{" "}
                  <Box
                    as="span"
                    css={{
                      fontWeight: "bold",
                    }}
                  >
                    #{currentRoundInfo.id}
                  </Box>{" "}
                  ended approximately{" "}
                  <Box
                    as="span"
                    css={{
                      fontWeight: "bold",
                    }}
                  >
                    {dayjs().subtract(timeOverdue, "seconds").fromNow(true)}
                  </Box>{" "}
                  ago. Awaiting an orchestrator to start round{" "}
                  <Box
                    as="span"
                    css={{
                      fontWeight: "bold",
                    }}
                  >
                    #{currentRoundInfo.id + 1}
                  </Box>
                  .
                </Text>
              ) : (
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
                    #{currentRoundInfo.id + 1}
                  </Box>{" "}
                  begins.
                </Text>
              )}
            </Box>
            {protocol && (
              <>
                <ExplorerTooltip
                  multiline
                  content={
                    <Box>
                      The amount of fees that have been paid out in the current
                      round. Equivalent to{" "}
                      {formatUSD(protocol?.currentRound?.volumeUSD, {
                        precision: 0,
                        abbreviate: true,
                      })}{" "}
                      at recent prices of ETH.
                    </Box>
                  }
                >
                  <Flex
                    css={{
                      marginTop: "$3",
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
                      <Box css={{ marginLeft: "$1" }}>
                        <Box
                          as={QuestionMarkCircledIcon}
                          css={{ color: "$neutral11" }}
                        />
                      </Box>
                    </Flex>

                    <Text
                      css={{
                        fontSize: "$2",
                        color: "white",
                      }}
                    >
                      {formatETH(protocol?.currentRound?.volumeETH, {
                        precision: 2,
                      })}
                    </Text>
                  </Flex>
                </ExplorerTooltip>
                <ExplorerTooltip
                  multiline
                  content={
                    <Box>
                      The amount of rewards which have been claimed by
                      orchestrators in the current round.
                    </Box>
                  }
                >
                  <Flex
                    css={{
                      marginTop: "$1",
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
                      <Box css={{ marginLeft: "$1" }}>
                        <Box
                          as={QuestionMarkCircledIcon}
                          css={{ color: "$neutral11" }}
                        />
                      </Box>
                    </Flex>

                    <Text
                      css={{
                        fontSize: "$2",
                        color: "white",
                      }}
                    >
                      {rewards}
                    </Text>
                  </Flex>
                </ExplorerTooltip>
                <Box
                  css={{
                    width: "100%",
                    borderTop: "1px solid $neutral6",
                    paddingTop: "8px",
                    marginTop: "8px",
                  }}
                >
                  <ExplorerTooltip
                    multiline
                    content={<Box>The current total supply of LPT.</Box>}
                  >
                    <Flex
                      css={{
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
                          Total Supply
                        </Text>
                        <Box css={{ marginLeft: "$1" }}>
                          <Box
                            as={QuestionMarkCircledIcon}
                            css={{ color: "$neutral11" }}
                          />
                        </Box>
                      </Flex>

                      <Text
                        css={{
                          fontSize: "$2",
                          color: "white",
                        }}
                      >
                        {totalSupply !== null
                          ? formatLPT(totalSupply, {
                              precision: 0,
                              abbreviate: true,
                            })
                          : "--"}
                      </Text>
                    </Flex>
                  </ExplorerTooltip>
                  <ExplorerTooltip
                    multiline
                    content={
                      <Box>Total supply change over the past 365 days.</Box>
                    }
                  >
                    <Flex
                      css={{
                        marginTop: "$1",
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
                          Supply Change (1Y)
                        </Text>
                        <Box css={{ marginLeft: "$1" }}>
                          <Box
                            as={QuestionMarkCircledIcon}
                            css={{ color: "$neutral11" }}
                          />
                        </Box>
                      </Flex>

                      <Text
                        css={{
                          fontSize: "$2",
                          color: "white",
                        }}
                      >
                        {isSupplyChangeLoading ? (
                          <Skeleton css={{ height: 16, width: 80 }} />
                        ) : supplyChangeData?.supplyChange != null ? (
                          formatPercent(supplyChangeData.supplyChange, {
                            precision: 2,
                          })
                        ) : (
                          "--"
                        )}
                      </Text>
                    </Flex>
                  </ExplorerTooltip>
                </Box>
              </>
            )}
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
