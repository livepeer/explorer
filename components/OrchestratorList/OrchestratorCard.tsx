import IdentityAvatar from "@components/IdentityAvatar";
import { formatTimeHorizon, ROIFactors, ROITimeHorizon } from "@lib/roi";
import { textTruncate } from "@lib/utils";
import {
  Badge,
  Box,
  Flex,
  Link as A,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@livepeer/design-system";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useEnsData } from "hooks";
import { useOrchestratorRowViewModel } from "hooks/useOrchestratorRowViewModel";
import Link from "next/link";
import numbro from "numbro";

import { OrchestratorActionsMenu } from "./OrchestratorActionsMenu";

type OrchestratorCardProps = {
  rowData: {
    id: string;
    earningsComputed: {
      feeShare: number | string;
      rewardCut: number | string;
      rewardCalls: number;
      rewardCallLength: number;
      isNewlyActive: boolean;
      roi: {
        delegatorPercent: {
          fees: number;
          rewards: number;
        };
        delegator: {
          fees: number;
          rewards: number;
        };
      };
      totalStake: number;
      ninetyDayVolumeETH: number;
    };
  };
  index: number;
  pageIndex: number;
  pageSize: number;
  timeHorizon: ROITimeHorizon;
  factors: ROIFactors;
};

export function OrchestratorCard({
  rowData,
  index,
  pageIndex,
  pageSize,
  timeHorizon,
  factors,
}: OrchestratorCardProps) {
  const identity = useEnsData(rowData.id);
  const earnings = rowData.earningsComputed;
  const { feeCut, rewardCut, rewardCalls, isNewlyActive } =
    useOrchestratorRowViewModel(earnings);

  return (
    <Box
      css={{
        border: "1px solid $neutral4",
        borderRadius: "$4",
        padding: "$4",
        backgroundColor: "$neutral2",
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      <Flex
        css={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "$3",
        }}
      >
        <Flex css={{ flexDirection: "column", flex: 1 }}>
          <Flex css={{ alignItems: "center", marginBottom: "$2" }}>
            <Box
              css={{
                marginRight: "$2",
                backgroundColor: "$neutral4",
                borderRadius: 1000,
                color: "$neutral11",
                fontWeight: 700,
                width: 24,
                height: 24,
                minWidth: 24,
                minHeight: 24,
                fontSize: 11,
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
              }}
            >
              {index + 1 + pageIndex * pageSize}
            </Box>
            <A
              as={Link}
              href={`/accounts/${rowData.id}/orchestrating`}
              passHref
              css={{
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
                flex: 1,
              }}
            >
              <Flex css={{ alignItems: "center" }}>
                <IdentityAvatar
                  identity={identity}
                  address={rowData.id}
                  css={{ marginRight: "$2" }}
                />
                {identity?.name ? (
                  <Flex css={{ fontWeight: 600, alignItems: "center" }}>
                    <Box
                      css={{
                        marginRight: "$2",
                        fontSize: "$3",
                      }}
                    >
                      {textTruncate(identity.name, 20, "…")}
                    </Box>
                    <Badge size="2" css={{ fontSize: "$2" }}>
                      {rowData.id.substring(0, 6)}
                    </Badge>
                  </Flex>
                ) : (
                  <Box css={{ fontWeight: 600 }}>
                    {rowData.id.replace(rowData.id.slice(7, 37), "…")}
                  </Box>
                )}
              </Flex>
            </A>
          </Flex>
        </Flex>
        <OrchestratorActionsMenu accountId={rowData.id} isMobile={true} />
      </Flex>

      <Box
        css={{
          borderTop: "1px solid $neutral6",
          paddingTop: "$3",
          marginTop: "$3",
        }}
      >
        <Flex
          css={{
            justifyContent: "space-between",
            marginBottom: "$2",
          }}
        >
          <Text variant="neutral" size="2">
            Forecasted Yield
          </Text>
          {isNewlyActive ? (
            <Badge
              size="2"
              css={{
                color: "$white",
                fontSize: "$2",
              }}
            >
              NEW ✨
            </Badge>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Badge
                  size="2"
                  css={{
                    cursor: "pointer",
                    color: "$white",
                    fontSize: "$2",
                  }}
                >
                  {numbro(
                    earnings.roi.delegatorPercent.fees +
                      earnings.roi.delegatorPercent.rewards
                  ).format({ mantissa: 1, output: "percent" })}
                  <Box css={{ marginLeft: "$1" }}>
                    <ChevronDownIcon />
                  </Box>
                </Badge>
              </PopoverTrigger>
              <PopoverContent
                css={{
                  minWidth: 300,
                  borderRadius: "$4",
                  bc: "$neutral4",
                }}
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
                placeholder={undefined}
              >
                <Box css={{ padding: "$4" }}>
                  <Text
                    size="1"
                    css={{
                      marginBottom: "$2",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    {`Yield (${formatTimeHorizon(timeHorizon)})`}
                  </Text>
                  {factors !== "eth" && (
                    <Flex>
                      <Text variant="neutral" size="2">
                        Rewards (
                        {numbro(earnings.roi.delegatorPercent.rewards).format({
                          mantissa: 1,
                          output: "percent",
                        })}
                        ):
                      </Text>
                      <Text
                        css={{
                          marginLeft: "auto",
                          fontWeight: 600,
                          color: "$white",
                        }}
                        size="2"
                      >
                        {numbro(earnings.roi.delegator.rewards).format({
                          mantissa: 1,
                        })}{" "}
                        LPT
                      </Text>
                    </Flex>
                  )}
                  {factors !== "lpt" && (
                    <Flex>
                      <Text variant="neutral" size="2">
                        Fees (
                        {numbro(earnings.roi.delegatorPercent.fees).format({
                          mantissa: 1,
                          output: "percent",
                        })}
                        ):
                      </Text>
                      <Text
                        css={{
                          marginLeft: "auto",
                          fontWeight: 600,
                          color: "$white",
                        }}
                        size="2"
                      >
                        {numbro(earnings.roi.delegator.fees).format({
                          mantissa: 3,
                        })}{" "}
                        ETH
                      </Text>
                    </Flex>
                  )}
                </Box>
              </PopoverContent>
            </Popover>
          )}
        </Flex>

        <Flex
          css={{
            justifyContent: "space-between",
            marginBottom: "$2",
          }}
        >
          <Text variant="neutral" size="2">
            Delegated Stake
          </Text>
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {numbro(earnings.totalStake).format({
              mantissa: 0,
              thousandSeparated: true,
            })}{" "}
            LPT
          </Text>
        </Flex>

        <Flex
          css={{
            justifyContent: "space-between",
            marginBottom: "$2",
          }}
        >
          <Text variant="neutral" size="2">
            Trailing 90D Fees
          </Text>
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {numbro(earnings.ninetyDayVolumeETH).format({
              mantissa: 2,
              average: true,
            })}{" "}
            ETH
          </Text>
        </Flex>

        <Box
          css={{
            borderTop: "1px solid $neutral6",
            paddingTop: "$3",
            marginTop: "$3",
          }}
        >
          <Text
            size="1"
            css={{
              marginBottom: "$2",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Orchestrator Details
          </Text>

          <Flex
            css={{
              justifyContent: "space-between",
              marginBottom: "$2",
            }}
          >
            <Text variant="neutral" size="2">
              Reward Cut
            </Text>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {rewardCut}
            </Text>
          </Flex>

          <Flex
            css={{
              justifyContent: "space-between",
              marginBottom: "$2",
            }}
          >
            <Text variant="neutral" size="2">
              Fee Cut
            </Text>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {feeCut}
            </Text>
          </Flex>

          <Flex
            css={{
              justifyContent: "space-between",
              marginBottom: "$2",
            }}
          >
            <Text variant="neutral" size="2">
              Reward Call Ratio (90d)
            </Text>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {rewardCalls}
            </Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  );
}
