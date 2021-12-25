import { useQuery, gql } from "@apollo/client";
import CircularProgressbar from "../CircularProgressBar";
import { buildStyles } from "react-circular-progressbar";
import moment from "moment";
import { useEffect } from "react";
import { usePageVisibility } from "core/hooks";
import { CheckIcon, Cross1Icon } from "@modulz/radix-icons";
import { useTheme } from "next-themes";
import {
  Box,
  Flex,
  Heading,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  themes,
} from "@livepeer/design-system";

const BLOCK_TIME = 13; // ethereum blocks are confirmed on average 13 seconds

const Index = () => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme?.includes("-")
    ? themes[resolvedTheme]
    : themes[`${resolvedTheme}-theme-green`];
  const isVisible = usePageVisibility();
  const pollInterval = 60000;
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
          lastInitializedRound {
            id
          }
          currentRound {
            id
            startBlock
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
        block
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
    } else {
      startPollingProtocol(pollInterval);
      startPollingBlock(pollInterval);
    }
  }, [
    isVisible,
    stopPollingProtocol,
    stopPollingBlock,
    startPollingProtocol,
    startPollingBlock,
  ]);

  if (protocolDataloading || blockDataLoading) {
    return null;
  }

  const currentRoundNumber = Math.floor(
    blockData.block.number / protocolData.protocol.roundLength
  );
  const initialized =
    +protocolData.protocol.lastInitializedRound.id === currentRoundNumber;
  const blocksRemaining = initialized
    ? +protocolData.protocol.roundLength -
      (blockData.block.number - +protocolData.protocol.currentRound.startBlock)
    : 0;
  const timeRemaining = BLOCK_TIME * blocksRemaining;
  const blocksSinceCurrentRoundStart = initialized
    ? blockData.block.number - +protocolData.protocol.currentRound.startBlock
    : 0;
  const percentage =
    (blocksSinceCurrentRoundStart / +protocolData.protocol.roundLength) * 100;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Flex
          css={{
            cursor: "pointer",
            py: 10,
            px: "$3",
            fontSize: "$2",
            fontWeight: 600,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "$neutral3",
            borderRadius: "$3",
            border: "1px solid $neutral5",
          }}
        >
          <Flex
            css={{
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box
              css={{
                width: 16,
                minWidth: 16,
                height: 16,
                minHeight: 16,
                mr: 12,
              }}
            >
              <CircularProgressbar
                strokeWidth={10}
                styles={buildStyles({
                  strokeLinecap: "butt",
                  pathColor: theme.colors.primary11,
                  textColor: theme.colors.black,
                  trailColor: theme.colors.neutral7,
                })}
                value={Math.round(percentage)}
              />
            </Box>
            Round #{currentRoundNumber}
          </Flex>
        </Flex>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle asChild>
          <Heading
            size="2"
            css={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              mb: "$5",
            }}
          >
            <Box css={{ fontWeight: 600 }}>Round #{currentRoundNumber}</Box>
            <Flex
              css={{ alignItems: "center", fontSize: "$3", fontWeight: 700 }}
            >
              Initialized{" "}
              {initialized ? (
                <Box
                  as={CheckIcon}
                  css={{ ml: "$1", width: 20, height: 20, color: "$primary11" }}
                />
              ) : (
                <Box
                  as={Cross1Icon}
                  css={{ ml: "$2", width: 20, height: 20, color: "$red11" }}
                />
              )}
            </Flex>
          </Heading>
        </DialogTitle>
        <Flex
          css={{
            pb: "$4",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            css={{
              width: 160,
              minWidth: 160,
              height: 160,
              minHeight: 160,
              mr: "$4",
              display: "none",
              "@bp3": {
                display: "block",
              },
            }}
          >
            <Box
              as={CircularProgressbar}
              strokeWidth={10}
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
            There are{" "}
            <Box
              as="span"
              css={{
                fontWeight: "bold",
                borderBottom: "1px dashed",
                borderColor: "$text",
              }}
            >
              {blocksRemaining} blocks
            </Box>{" "}
            and approximately{" "}
            <Box
              as="span"
              css={{
                fontWeight: "bold",
                borderBottom: "1px dashed",
                borderColor: "$text",
              }}
            >
              {moment().add(timeRemaining, "seconds").fromNow(true)}
            </Box>{" "}
            remaining until the current round ends and round{" "}
            <Box
              as="span"
              css={{
                fontWeight: "bold",
                borderBottom: "1px dashed",
                borderColor: "$text",
              }}
            >
              #{currentRoundNumber + 1}
            </Box>{" "}
            begins.
          </Box>
        </Flex>
      </DialogContent>
    </Dialog>
  );
};

export default Index;
