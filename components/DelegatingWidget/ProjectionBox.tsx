import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { Box, Card, Flex, Text } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import { useExplorerStore } from "hooks";
import numeral from "numeral";
import { useMemo } from "react";

const ProjectionBox = ({ action }) => {
  const { yieldResults } = useExplorerStore();

  const formattedPrinciple = useMemo(
    () => numeral(Number(yieldResults?.principle) || 0).format("0a"),
    [yieldResults]
  );

  return (
    <Card
      css={{
        bc: "$neutral3",
        boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
        width: "100%",
        borderRadius: "$4",
        mb: "$3",
      }}
    >
      <Box css={{ px: "$3", py: "$3" }}>
        <Box>
          <Flex
            css={{
              fontSize: "$1",
              mb: "$2",
              ai: "center",
              justifyContent: "space-between",
            }}
          >
            <Box css={{ color: "$neutral11" }}>
              <Flex css={{ ai: "center" }}>
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
                  <Flex css={{ ml: "$1" }}>
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
                {numeral(
                  yieldResults.principle
                    ? (yieldResults.roiFeesLpt + yieldResults.roiRewards) /
                        +yieldResults.principle
                    : 0
                ).format("0.0%")}
              </Box>
            )}
          </Flex>

          <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
            <Flex css={{ ai: "center" }}>
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
                <Flex css={{ ml: "$1" }}>
                  <Box
                    as={QuestionMarkCircledIcon}
                    css={{ color: "$neutral11" }}
                  />
                </Flex>
              </ExplorerTooltip>
            </Flex>
            <Text css={{ fontSize: "$2", fontFamily: "$monospace" }}>
              {numeral(yieldResults.roiRewards).format("0.0")} LPT
            </Text>
          </Flex>
          <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
            <Flex css={{ ai: "center" }}>
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
                <Flex css={{ ml: "$1" }}>
                  <Box
                    as={QuestionMarkCircledIcon}
                    css={{ color: "$neutral11" }}
                  />
                </Flex>
              </ExplorerTooltip>
            </Flex>
            <Text css={{ fontSize: "$2", fontFamily: "$monospace" }}>
              {(() => {
                try {
                  const formattedValue = numeral(yieldResults.roiFees).format("0.000");
                  return formattedValue === 'NaN' ? '0.000' : formattedValue;
                } catch {
                  return '0.000';
                }
              })()} ETH
            </Text>
          </Flex>
        </Box>
      </Box>
    </Card>
  );
};

export default ProjectionBox;
