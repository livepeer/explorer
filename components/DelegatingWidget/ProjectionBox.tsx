import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { Box, Card, Flex, Text } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { useExplorerStore } from "hooks";
import numbro from "numbro";
import { useMemo } from "react";

const ProjectionBox = ({ action }) => {
  const { yieldResults } = useExplorerStore();

  const formattedPrinciple = useMemo(
    () =>
      numbro(Number(yieldResults?.principle) || 0).format({
        mantissa: 0,
        average: true,
      }),
    [yieldResults]
  );

  return (
    <Card
      css={{
        backgroundColor: "$neutral3",
        boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
        width: "100%",
        borderRadius: "$4",
        marginBottom: "$3",
      }}
    >
      <Box
        css={{
          paddingLeft: "$3",
          paddingRight: "$3",
          paddingTop: "$3",
          paddingBottom: "$3",
        }}
      >
        <Box>
          <Flex
            css={{
              fontSize: "$1",
              marginBottom: "$2",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box css={{ color: "$neutral11" }}>
              <Flex css={{ alignItems: "center" }}>
                <Box>
                  {action === "delegate"
                    ? "Forecasted Yield (1Y)"
                    : "Forecasted Opportunity Cost (1Y)"}
                </Box>
                <ExplorerTooltip
                  multiline
                  content={
                    <Box>
                      {action === "delegate"
                        ? `The expected earnings if you were to delegate
                    ${formattedPrinciple} LPT to this orchestrator. This is only an
                    estimate based on recent performance data and is subject to
                    change.`
                        : `The expected earnings you would not receive in the next year, if you were to undelegate
                        ${formattedPrinciple} LPT from this orchestrator.`}
                    </Box>
                  }
                >
                  <Flex css={{ marginLeft: "$1" }}>
                    <Box
                      as={QuestionMarkCircledIcon}
                      css={{ color: "$neutral11" }}
                    />
                  </Flex>
                </ExplorerTooltip>
              </Flex>
            </Box>
            {action === "delegate" && (
              <Box css={{ fontFamily: "$monospace", color: "$neutral11" }}>
                {numbro(
                  yieldResults.principle
                    ? (yieldResults.roiFeesLpt + yieldResults.roiRewards) /
                        +yieldResults.principle
                    : 0
                ).format({
                  mantissa: 1,
                  output: "percent",
                })}
              </Box>
            )}
          </Flex>

          <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
            <Flex css={{ alignItems: "center" }}>
              <Text css={{ fontSize: "$2" }}>Inflationary Rewards</Text>
              <ExplorerTooltip
                multiline
                content={
                  <Box>
                    The forecasted LPT rewards you would receive, based on your
                    input stake and the total stake for the orchestrator.
                  </Box>
                }
              >
                <Flex css={{ marginLeft: "$1" }}>
                  <Box
                    as={QuestionMarkCircledIcon}
                    css={{ color: "$neutral11" }}
                  />
                </Flex>
              </ExplorerTooltip>
            </Flex>
            <Text css={{ fontSize: "$2", fontFamily: "$monospace" }}>
              {numbro(yieldResults.roiRewards).format({
                mantissa: 1,
              })}{" "}
              LPT
            </Text>
          </Flex>
          <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
            <Flex css={{ alignItems: "center" }}>
              <Text css={{ fontSize: "$2" }}>Fee Share</Text>
              <ExplorerTooltip
                multiline
                content={
                  <Box>
                    The projected fee share you would receive for the work that
                    the orchestrator performs on the network (in Ether).
                  </Box>
                }
              >
                <Flex css={{ marginLeft: "$1" }}>
                  <Box
                    as={QuestionMarkCircledIcon}
                    css={{ color: "$neutral11" }}
                  />
                </Flex>
              </ExplorerTooltip>
            </Flex>
            <Text css={{ fontSize: "$2", fontFamily: "$monospace" }}>
              {numbro(yieldResults.roiFees).format({
                mantissa: 3,
              })}{" "}
              ETH
            </Text>
          </Flex>
        </Box>
      </Box>
    </Card>
  );
};

export default ProjectionBox;
