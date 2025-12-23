import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Spinner from "@components/Spinner";
import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import dayjs from "@lib/dayjs";
import { Box, Flex, getThemes, Text } from "@livepeer/design-system";
import {
  CheckIcon,
  Cross1Icon,
  QuestionMarkCircledIcon,
} from "@modulz/radix-icons";
import { ProtocolQueryResult } from "apollo";
import { useCurrentRoundData, useSupplyChangeData } from "hooks";
import { useTheme } from "next-themes";
import numbro from "numbro";
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

  const blocksRemaining = useMemo(
    () =>
      currentRoundInfo?.initialized && protocol
        ? +protocol.roundLength -
          (+Number(currentRoundInfo.currentL1Block) -
            +Number(currentRoundInfo.startBlock))
        : 0,
    [protocol, currentRoundInfo]
  );
  const timeRemaining = useMemo(
    () => AVERAGE_L1_BLOCK_TIME * blocksRemaining,
    [blocksRemaining]
  );
  const blocksSinceCurrentRoundStart = useMemo(
    () =>
      currentRoundInfo?.initialized
        ? +Number(currentRoundInfo.currentL1Block) -
          +Number(currentRoundInfo.startBlock)
        : 0,
    [currentRoundInfo]
  );

  const percentage = useMemo(
    () =>
      protocol
        ? (blocksSinceCurrentRoundStart / +protocol.roundLength) * 100
        : 0,
    [blocksSinceCurrentRoundStart, protocol]
  );

  const isRoundLocked = useMemo(
    () =>
      protocol && currentRoundInfo
        ? blocksRemaining <= Number(protocol?.lockPeriod)
        : false,
    [protocol, blocksRemaining, currentRoundInfo]
  );

  const rewardTokensClaimed = useMemo(
    () =>
      protocol?.currentRound?.pools?.reduce(
        (prev, pool) => prev + Number(pool?.rewardTokens || 0),
        0
      ) || 0,
    [protocol]
  );
  const totalSupply = useMemo(
    () => (protocol?.totalSupply ? Number(protocol.totalSupply) : null),
    [protocol]
  );
  const supplyChangeData = useSupplyChangeData();

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
      </Flex>

      <Box
        css={{
          width: "100%",
          marginTop: "$2",
        }}
      >
        {!currentRoundInfo || !protocol ? (
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
                    {blocksSinceCurrentRoundStart}
                  </Box>
                  <Box css={{ fontSize: "$1" }}>
                    of {protocol.roundLength} blocks
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
                  #{+Number(currentRoundInfo.id) + 1}
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
                  {numbro(
                    protocol?.currentRound?.volumeUSD || 0
                  ).formatCurrency({
                    mantissa: 0,
                    average: true,
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
                  {numbro(protocol?.currentRound?.volumeETH || 0).format({
                    mantissa: 2,
                    average: true,
                  })}{" "}
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
                  {numbro(rewardTokensClaimed).format({
                    mantissa: 0,
                  })}
                  /
                  {numbro(protocol?.currentRound?.mintableTokens || 0).format({
                    mantissa: 0,
                  })}{" "}
                  LPT
                </Text>
              </Flex>
            </ExplorerTooltip>
            <Box css={{ marginTop: "$3" }} />
            <ExplorerTooltip
              multiline
              content={<Box>The current total supply of LPT.</Box>}
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
                    ? `${numbro(totalSupply).format({
                        mantissa: 0,
                        average: true,
                      })} LPT`
                    : "--"}
                </Text>
              </Flex>
            </ExplorerTooltip>
            <ExplorerTooltip
              multiline
              content={<Box>Total supply change over the past 365 days.</Box>}
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
                  {supplyChangeData?.supplyChange !== null
                    ? numbro(supplyChangeData?.supplyChange ?? 0).format({
                        output: "percent",
                        mantissa: 2,
                      })
                    : "--"}
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
