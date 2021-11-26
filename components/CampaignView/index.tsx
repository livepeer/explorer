import Card from "../Card";
import { abbreviateNumber, expandedPriceLabels } from "../../lib/utils";
import ReactTooltip from "react-tooltip";
import { useRef, useState } from "react";
import Price from "../Price";
import { CheckIcon, Cross1Icon } from "@modulz/radix-icons";
import HelpIcon from "../HelpIcon";
import {
  Box,
  Flex,
  Heading,
  Text,
  Card as CardBase,
  Tooltip,
} from "@livepeer/design-system";
import Stat from "../Stat";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";

const Subtitle = ({ css = {}, children }) => {
  return (
    <Box
      css={{
        fontSize: "$4",
        color: "$text",
        fontWeight: 500,
        fontFamily: "$monospace",
        "@bp2": {
          fontSize: "$5",
        },
        ...css,
      }}
    >
      {children}
    </Box>
  );
};

const Index = ({ currentRound, transcoder }) => {
  const [isPriceSettingOpen, setIsPriceSettingOpen] = useState(false);
  const targetRef = useRef();
  const [priceSetting, setPriceSetting] = useState("pixel");
  const callsMade = transcoder.pools.filter(
    (r) => r.rewardTokens != null
  ).length;
  const active =
    transcoder?.activationRound <= currentRound.id &&
    transcoder?.deactivationRound > currentRound.id;

  const PriceSettingToggle = () => (
    <Box
      as="span"
      ref={targetRef}
      onClick={(e) => {
        e.stopPropagation();
        setIsPriceSettingOpen(true);
      }}
      css={{
        cursor: "pointer",
        fontSize: 12,
      }}
    >
      <Box as="span" css={{ mx: "4px" }}>
        /
      </Box>
      <Box
        as="span"
        title={`Price of transcoding per ${expandedPriceLabels[priceSetting]}`}
        css={{
          color: "$text",
        }}
      >
        {priceSetting}
      </Box>
    </Box>
  );
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
              {!transcoder.feeShare
                ? 0
                : 100 - parseInt(transcoder.feeShare, 10) / 10000}
              %
            </>
          }
        />
        <Stat
          label={
            <Tooltip
              multiline
              content={
                <Box>
                  Price of transcoding per pixel orchestrator is charging
                </Box>
              }
            >
              <Flex css={{ ai: "center" }}>
                <Box css={{ mr: "$1" }}>Price / Pixel</Box>
                <QuestionMarkCircledIcon />
              </Flex>
            </Tooltip>
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
                <Flex css={{ ai: "center" }}>
                  <Box css={{ mr: "$1" }}>Last Reward Round</Box>
                  <QuestionMarkCircledIcon />
                </Flex>
              </Tooltip>
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
