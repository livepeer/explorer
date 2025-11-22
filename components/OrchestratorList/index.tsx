import PopoverLink from "@components/PopoverLink";
import { bondingManager } from "@lib/api/abis/main/BondingManager";
import Table from "@components/Table";
import IdentityAvatar from "@components/IdentityAvatar";
import { textTruncate } from "@lib/utils";
import {
  Badge,
  Box,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Flex,
  IconButton,
  Link as A,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  TextField,
} from "@livepeer/design-system";
import {
  ChevronDownIcon,
  DotsHorizontalIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import dayjs from "@lib/dayjs";
import Link from "next/link";

import { useCallback, useEffect, useMemo, useState } from "react";
import numbro from "numbro";
import { useBondingManagerAddress } from "hooks/useContracts";

import YieldChartIcon from "../../public/img/yield-chart.svg";

import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import {
  calculateROI,
  ROIFactors,
  ROIInflationChange,
  ROITimeHorizon,
} from "@lib/roi";
import {
  ArrowTopRightIcon,
  // ExclamationTriangleIcon,
} from "@modulz/radix-icons";
import { OrchestratorsQueryResult, ProtocolQueryResult } from "apollo";
import { useEnsData } from "hooks";
import { useReadContract } from "wagmi";

const formatTimeHorizon = (timeHorizon: ROITimeHorizon) =>
  timeHorizon === "one-year"
    ? `1Y`
    : timeHorizon === "half-year"
    ? `6M`
    : timeHorizon === "three-years"
    ? `3Y`
    : timeHorizon === "two-years"
    ? `2Y`
    : timeHorizon === "four-years"
    ? `4Y`
    : "N/A";

const formatFactors = (factors: ROIFactors) =>
  factors === "lpt+eth"
    ? `LPT + ETH`
    : factors === "lpt"
    ? `LPT Only`
    : `ETH Only`;

const OrchestratorList = ({
  data,
  protocolData,
  pageSize = 10,
}: {
  pageSize: number;
  protocolData:
    | NonNullable<ProtocolQueryResult["data"]>["protocol"]
    | undefined;
  data:
    | NonNullable<OrchestratorsQueryResult["data"]>["transcoders"]
    | undefined;
}) => {
  const formatPercentChange = useCallback(
    (change: ROIInflationChange) =>
      change === "none"
        ? `Fixed at ${numbro(
            Number(protocolData?.inflation) / 1000000000
          ).format({
            mantissa: 3,
            output: "percent",
          })}`
        :  `${numbro(
            Number(protocolData?.inflationChange) / 1000000000
          ).format({ mantissa: 5, output: "percent", forceSign: true })} per round`,
       
    [protocolData?.inflation, protocolData?.inflationChange]
  );

  const [principle, setPrinciple] = useState<number>(150);
  const [inflationChange, setInflationChange] =
    useState<ROIInflationChange>("none");
  const [factors, setFactors] = useState<ROIFactors>("lpt+eth");
  const [timeHorizon, setTimeHorizon] = useState<ROITimeHorizon>("one-year");
  const maxSupplyTokens = useMemo(
    () => Math.floor(Number(protocolData?.totalSupply || 1e7)),
    [protocolData]
  );
  const formattedPrinciple = useMemo(
    () => numbro(Number(principle) || 150).format({ mantissa: 0, average: true }),
    [principle]
  );
  const { data: bondingManagerAddress } = useBondingManagerAddress();
  const { data: treasuryRewardCutRate = BigInt(0.0) } = useReadContract({
    query: { enabled: Boolean(bondingManagerAddress) },
    address: bondingManagerAddress,
    abi: bondingManager,
    functionName: "treasuryRewardCutRate",
  });

  const mappedData = useMemo(() => {
    return data
      ?.map((row) => {
        const pools = row.pools ?? [];
        const rewardCalls =
          pools.length > 0 ? pools.filter((r) => r?.rewardTokens).length : 0;
        const rewardCallRatio = rewardCalls / pools.length;

        const activation = dayjs.unix(row.activationTimestamp);

        const isNewlyActive = dayjs().diff(activation, "days") < 45;

        const feeShareDaysSinceChange = dayjs().diff(
          dayjs.unix(row.feeShareUpdateTimestamp),
          "days"
        );
        const rewardCutDaysSinceChange = dayjs().diff(
          dayjs.unix(row.rewardCutUpdateTimestamp),
          "days"
        );

        const roi = calculateROI({
          inputs: {
            principle: Number(principle),
            timeHorizon,
            inflationChange,
            factors,
          },
          orchestratorParams: {
            totalStake: Number(row.totalStake),
          },
          feeParams: {
            ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
            feeShare: Number(row.feeShare) / 1000000,
            lptPriceEth: Number(protocolData?.lptPriceEth),
          },
          rewardParams: {
            inflation: Number(protocolData?.inflation) / 1000000000,
            inflationChangePerRound:
              Number(protocolData?.inflationChange) / 1000000000,
            totalSupply: Number(protocolData?.totalSupply),
            totalActiveStake: Number(protocolData?.totalActiveStake),
            roundLength: Number(protocolData?.roundLength),

            rewardCallRatio,
            rewardCut: Number(row.rewardCut) / 1000000,
            treasuryRewardCut:
              Number(treasuryRewardCutRate / BigInt(1e18)) / 1e9,
          },
        });

        return {
          ...row,
          daysSinceChangeParams:
            (feeShareDaysSinceChange < rewardCutDaysSinceChange
              ? feeShareDaysSinceChange
              : rewardCutDaysSinceChange) ?? 0,
          daysSinceChangeParamsFormatted:
            (feeShareDaysSinceChange < rewardCutDaysSinceChange
              ? dayjs.unix(row.feeShareUpdateTimestamp).fromNow()
              : dayjs.unix(row.rewardCutUpdateTimestamp).fromNow()) ?? "",
          earningsComputed: {
            roi,
            activation,
            isNewlyActive,
            rewardCalls,
            rewardCallLength: pools.length,
            rewardCallRatio,
            feeShare: row.feeShare,
            rewardCut: row.rewardCut,
            ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
            totalActiveStake: Number(protocolData?.totalActiveStake),
            totalStake: Number(row.totalStake),
          },
        };
      })
      .sort((a, b) =>
        a.earningsComputed.isNewlyActive
          ? 1
          : b.earningsComputed.isNewlyActive
          ? -1
          : a.earningsComputed.roi.delegatorPercent.fees +
              a.earningsComputed.roi.delegatorPercent.rewards >
            b.earningsComputed.roi.delegatorPercent.fees +
              b.earningsComputed.roi.delegatorPercent.rewards
          ? -1
          : 1
      );
  }, [
    data,
    inflationChange,
    protocolData,
    principle,
    timeHorizon,
    factors,
    treasuryRewardCutRate,
  ]);

  const columns = useMemo(
    () => [
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The account which is actively coordinating transcoders and
                receiving fees/rewards.
              </Box>
            }
          >
            <Box>Orchestrator</Box>
          </ExplorerTooltip>
        ),
        accessor: "id",
        Cell: ({ row }) => {
          const identity = useEnsData(row.values.id);

          return (
            <A
              as={Link}
              href={`/accounts/${row.values.id}/orchestrating`}
              passHref
              css={{
                width: 350,
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
              }}
            >
              <Flex css={{ alignItems: "center" }}>
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
                  {+row.id + 1}
                </Box>

                <Flex css={{ marginRight: "$2", alignItems: "center" }}>
                  <IdentityAvatar
                    identity={identity}
                    address={row.values.id}
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
                        {row.values.id.substring(0, 6)}
                      </Badge>
                    </Flex>
                  ) : (
                    <Box css={{ fontWeight: 600 }}>
                      {row.values.id.replace(row.values.id.slice(7, 37), "…")}
                    </Box>
                  )}
                  {/* {(row?.original?.daysSinceChangeParams ??
                      Number.MAX_VALUE) < 30 && (
                      <ExplorerTooltip
                        multiline
                        content={`This orchestrator changed their fee or reward cut ${row?.original?.daysSinceChangeParamsFormatted}.`}
                      >
                        <Box>
                          <Box
                            as={ExclamationTriangleIcon}
                            css={{ ml: "$2", color: "$neutral11" }}
                          />
                        </Box>
                      </ExplorerTooltip>
                    )} */}
                </Flex>
              </Flex>
            </A>
          );
        },
      },
      {
        Header: "Identity",
        accessor: "identity",
      },
      {
        Header: (
          <Flex css={{ flexDirection: "row", alignItems: "center" }}>
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  The estimate of earnings over {formatTimeHorizon(timeHorizon)}{" "}
                  if you were to delegate {formattedPrinciple} LPT to this
                  orchestrator. This is based on recent performance data and may
                  differ from actual yield.
                </Box>
              }
            >
              <Box>Forecasted Yield</Box>
            </ExplorerTooltip>
          </Flex>
        ),
        accessor: (row) => row.earningsComputed,
        id: "earnings",
        Cell: ({ row }) => {
          const isNewlyActive = useMemo(
            () => row.values.earnings.isNewlyActive,
            [row.values?.earnings?.isNewlyActive]
          );
          const feeCut = useMemo(
            () =>
              numbro(
                1 - Number(row.values.earnings.feeShare) / 1000000
              ).format({ mantissa: 0, output: "percent" }),
            [row.values.earnings.feeShare]
          );
          const rewardCut = useMemo(
            () =>
              numbro(Number(row.values.earnings.rewardCut) / 1000000).format(
                { mantissa: 0, output: "percent" }
              ),
            [row.values.earnings.rewardCut]
          );
          const rewardCalls = useMemo(
            () =>
              `${numbro(row.values.earnings.rewardCalls)
                .divide(row.values.earnings.rewardCallLength)
                .format({ mantissa: 0, output: "percent" })}`,
            [
              row.values.earnings.rewardCalls,
              row.values.earnings.rewardCallLength,
            ]
          );

          return (
            <Popover>
              <PopoverTrigger disabled={isNewlyActive} asChild>
                <Badge
                  size="2"
                  css={{
                    cursor: !isNewlyActive ? "pointer" : "default",
                    color: "$white",
                    fontSize: "$2",
                  }}
                >
                  {isNewlyActive ? (
                    "NEW ✨"
                  ) : (
                    <>
                      <Box>
                        {numbro(
                          row.values.earnings.roi.delegatorPercent.fees +
                            row.values.earnings.roi.delegatorPercent.rewards
                        ).format({ mantissa: 1, output: "percent" })}
                      </Box>
                      <Box css={{ marginLeft: "$1" }}>
                        <ChevronDownIcon />
                      </Box>
                    </>
                  )}
                </Badge>
              </PopoverTrigger>
              {!isNewlyActive && (
                <PopoverContent
                  css={{ minWidth: 300, borderRadius: "$4", bc: "$neutral4" }}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  placeholder={undefined}
                >
                  <Box
                    css={{
                      padding: "$4",
                    }}
                  >
                    <Box css={{}}>
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
                          <Text
                            variant="neutral"
                            css={{
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            Rewards (
                            {numbro(
                              row.values.earnings.roi.delegatorPercent.rewards
                            ).format({ mantissa: 1, output: "percent" })}
                            ):
                          </Text>
                          <Text
                            css={{
                              marginLeft: "auto",
                              display: "block",
                              fontWeight: 600,
                              color: "$white",
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            {numbro(
                              row.values.earnings.roi.delegator.rewards
                            ).format({ mantissa: 1 })}
                            {" LPT"}
                          </Text>
                        </Flex>
                      )}
                      {factors !== "lpt" && (
                        <Flex>
                          <Text
                            variant="neutral"
                            css={{
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            Fees (
                            {numbro(
                              row.values.earnings.roi.delegatorPercent.fees
                            ).format({ mantissa: 1, output: "percent" })}
                            ):
                          </Text>
                          <Text
                            css={{
                              marginLeft: "auto",
                              display: "block",
                              fontWeight: 600,
                              color: "$white",
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            {numbro(
                              row.values.earnings.roi.delegator.fees
                            ).format({ mantissa: 3 })}
                            {" ETH"}
                          </Text>
                        </Flex>
                      )}
                      <A
                        as={Link}
                        passHref
                        href="https://docs.livepeer.org/delegators/reference/yield-calculation"
                      >
                        <Flex
                          css={{
                            marginTop: "$2",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            css={{ whiteSpace: "nowrap" }}
                            variant="neutral"
                            size="1"
                          >
                            Learn how this calculation is performed
                          </Text>
                          <Box
                            css={{ marginLeft: "$1", width: 15, height: 15 }}
                            as={ArrowTopRightIcon}
                          />
                        </Flex>
                      </A>
                    </Box>

                    <Box
                      css={{
                        marginTop: "$3",
                        paddingTop: "$3",
                        borderTop: "1px solid $neutral6",
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
                        Orchestrator Data
                      </Text>

                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Reward cut
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {rewardCut}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Fee cut
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {feeCut}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {"Reward call ratio (90d)"}
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {rewardCalls}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {"Trailing 90d fees"}
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(
                            row.values.earnings.ninetyDayVolumeETH
                          ).format({ mantissa: 3, average: true })}
                          {" ETH"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {"Delegated stake"}
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(row.values.earnings.totalStake).format(
                            { mantissa: 1, average: true }
                          )}
                          {" LPT"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Latest fee/reward change
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {row?.original?.daysSinceChangeParams} days ago
                        </Text>
                      </Flex>
                    </Box>

                    <Box
                      css={{
                        marginTop: "$3",
                        paddingTop: "$3",
                        borderTop: "1px solid $neutral6",
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
                        Assumptions
                      </Text>

                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Block time
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(AVERAGE_L1_BLOCK_TIME).format({ mantissa: 0 })}
                          {" seconds"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Time horizon
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(
                            row.values.earnings.roi.params.roundsCount
                          ).format({ mantissa: 0 })}
                          {" rounds"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Total stake
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(row.values.earnings.totalActiveStake).format(
                            { mantissa: 1, average: true }
                          )}
                          {" LPT"}
                        </Text>
                      </Flex>
                    </Box>
                  </Box>
                </PopoverContent>
              )}
            </Popover>
          );
        },
        sortType: (rowA, rowB) => {
          return rowA.values.earnings.isNewlyActive
            ? -1
            : rowB.values.earnings.isNewlyActive
            ? 1
            : rowA.values.earnings.roi.delegatorPercent.fees +
                rowA.values.earnings.roi.delegatorPercent.rewards >
              rowB.values.earnings.roi.delegatorPercent.fees +
                rowB.values.earnings.roi.delegatorPercent.rewards
            ? 1
            : -1;
        },
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The total amount of stake currently delegated to this
                orchestrator.
              </Box>
            }
          >
            <Box>Delegated Stake</Box>
          </ExplorerTooltip>
        ),
        accessor: "totalStake",
        Cell: ({ row }) => (
          <Box>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {numbro(row.values.totalStake).format({ mantissa: 0, thousandSeparated: true })} LPT
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The total fees this orchestrator has earned in the past 90
                calendar days.
              </Box>
            }
          >
            <Box>Trailing 90D Fees</Box>
          </ExplorerTooltip>
        ),
        accessor: "ninetyDayVolumeETH",
        Cell: ({ row }) => (
          <Box>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {numbro(row.values.ninetyDayVolumeETH).format({ mantissa: 2, average: true })} ETH
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: <></>,
        id: "actions",
        Cell: ({ row }) => (
          <Popover>
            <PopoverTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              asChild
            >
              <Flex css={{ alignItems: "center" }}>
                <IconButton
                  aria-label="Orchestrator actions"
                  css={{
                    cursor: "pointer",
                    marginLeft: "$1",
                    opacity: 1,
                    transition: "background-color .3s",
                    "&:hover": {
                      bc: "$primary5",
                      transition: "background-color .3s",
                    },
                  }}
                >
                  <DotsHorizontalIcon />
                </IconButton>
              </Flex>
            </PopoverTrigger>
            <PopoverContent
              css={{ borderRadius: "$4", bc: "$neutral4" }}
              onClick={(e) => {
                e.stopPropagation();
              }}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
              placeholder={undefined}
            >
              <Box
                css={{
                  borderBottom: "1px solid $neutral6",
                  paddingLeft: "$1",
                  paddingRight: "$1",
                  paddingTop: "$1",
                  paddingBottom: "$2",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    marginLeft: "$3",
                    marginTop: "$2",
                    marginBottom: "$2",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Actions
                </Text>

                <PopoverLink href={`/accounts/${row.values.id}/orchestrating`}>
                  Delegate
                </PopoverLink>
              </Box>
              <Flex
                css={{
                  flexDirection: "column",
                  padding: "$1",
                  borderBottom: "1px solid $neutral6",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    marginLeft: "$3",
                    marginTop: "$2",
                    marginBottom: "$2",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Account Details
                </Text>

                <PopoverLink href={`/accounts/${row.values.id}/orchestrating`}>
                  Orchestrating
                </PopoverLink>
                <PopoverLink href={`/accounts/${row.values.id}/delegating`}>
                  Delegating
                </PopoverLink>
                <PopoverLink href={`/accounts/${row.values.id}/history`}>
                  History
                </PopoverLink>
              </Flex>
            </PopoverContent>
          </Popover>
        ),
      },
    ],
    [formattedPrinciple, timeHorizon, factors]
  );

  return (
    <Table
      data={mappedData as any}
      columns={columns as any}
      initialState={{
        pageSize,
        hiddenColumns: ["identity"],
        sortBy: [
          {
            id: "earnings",
            desc: true,
          },
        ],
      }}
      input={
        <Box css={{ marginBottom: "$2" }}>
          <Flex css={{ alignItems: "center", marginBottom: "$2" }}>
            <Box css={{ marginRight: "$1", color: "$neutral11" }}>
              <YieldChartIcon />
            </Box>
            <Text
              variant="neutral"
              size="1"
              css={{
                marginLeft: "$1",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {"Forecasted Yield Assumptions"}
            </Text>
          </Flex>
          <Flex>
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={(e) => {
                  e.stopPropagation();
                }}
                asChild
              >
                <Badge
                  size="2"
                  css={{
                    cursor: "pointer",
                    color: "$white",
                    fontSize: "$2",
                  }}
                >
                  <Box css={{ marginRight: "$1" }}>
                    <Pencil1Icon />
                  </Box>

                  <Text
                    variant="neutral"
                    size="1"
                    css={{
                      marginRight: 3,
                    }}
                  >
                    {"Time horizon:"}
                  </Text>
                  <Text
                    size="1"
                    css={{
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    {formatTimeHorizon(timeHorizon)}
                  </Text>
                </Badge>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                css={{
                  width: "200px",
                  mt: "$1",
                  boxShadow:
                    "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                  bc: "$neutral4",
                }}
                align="center"
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
                placeholder={undefined}
              >
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    css={{
                      cursor: "pointer",
                    }}
                    onSelect={() => setTimeHorizon("half-year")}
                  >
                    {"6 months"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    css={{
                      cursor: "pointer",
                    }}
                    onSelect={() => setTimeHorizon("one-year")}
                  >
                    {"1 year"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    css={{
                      cursor: "pointer",
                    }}
                    onSelect={() => setTimeHorizon("two-years")}
                  >
                    {"2 years"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    css={{
                      cursor: "pointer",
                    }}
                    onSelect={() => setTimeHorizon("three-years")}
                  >
                    {"3 years"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    css={{
                      cursor: "pointer",
                    }}
                    onSelect={() => setTimeHorizon("four-years")}
                  >
                    {"4 years"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <Box css={{ marginLeft: "$1" }}>
              <Popover>
                <PopoverTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  asChild
                >
                  <Badge
                    size="2"
                    css={{
                      cursor: "pointer",
                      color: "$white",
                      fontSize: "$2",
                    }}
                  >
                    <Box css={{ marginRight: "$1" }}>
                      <Pencil1Icon />
                    </Box>
                    <Text
                      variant="neutral"
                      size="1"
                      css={{
                        marginRight: 3,
                      }}
                    >
                      {"Delegation:"}
                    </Text>
                    <Text
                      size="1"
                      css={{
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {numbro(principle).format({ mantissa: 1, average: true })}
                      {" LPT"}
                    </Text>
                  </Badge>
                </PopoverTrigger>
                <PopoverContent
                  css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  placeholder={undefined}
                >
                  <Box
                    css={{
                      borderBottom: "1px solid $neutral6",
                      padding: "$3",
                    }}
                  >
                    <Flex align="center">
                      <TextField
                        name="principle"
                        placeholder="Amount in LPT"
                        type="number"
                        size="2"
                        value={principle}
                        onChange={(e) => {
                          setPrinciple(
                            Number(e.target.value) > maxSupplyTokens
                              ? maxSupplyTokens
                              : Number(e.target.value)
                          );
                        }}
                        min="1"
                        max={`${Number(
                          protocolData?.totalSupply || 1e7
                        ).toFixed(0)}`}
                      />
                      <Text
                        variant="neutral"
                        size="3"
                        css={{
                          marginLeft: "$2",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        LPT
                      </Text>
                    </Flex>
                  </Box>
                </PopoverContent>
              </Popover>
            </Box>
            <Box css={{ marginLeft: "$1" }}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  asChild
                >
                  <Badge
                    size="2"
                    css={{
                      cursor: "pointer",
                      color: "$white",
                      fontSize: "$2",
                    }}
                  >
                    <Box css={{ marginRight: "$1" }}>
                      <Pencil1Icon />
                    </Box>

                    <Text
                      variant="neutral"
                      size="1"
                      css={{
                        marginRight: 3,
                      }}
                    >
                      {"Factors:"}
                    </Text>
                    <Text
                      size="1"
                      css={{
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {formatFactors(factors)}
                    </Text>
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  css={{
                    width: "200px",
                    mt: "$1",
                    boxShadow:
                      "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                    bc: "$neutral4",
                  }}
                  align="center"
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  placeholder={undefined}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      css={{
                        cursor: "pointer",
                      }}
                      onSelect={() => setFactors("lpt+eth")}
                    >
                      {formatFactors("lpt+eth")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      css={{
                        cursor: "pointer",
                      }}
                      onSelect={() => setFactors("lpt")}
                    >
                      {formatFactors("lpt")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      css={{
                        cursor: "pointer",
                      }}
                      onSelect={() => setFactors("eth")}
                    >
                      {formatFactors("eth")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Box>
            <Box css={{ marginLeft: "$1" }}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  asChild
                >
                  <Badge
                    size="2"
                    css={{
                      cursor: "pointer",
                      color: "$white",
                      fontSize: "$2",
                    }}
                  >
                    <Box css={{ marginRight: "$1" }}>
                      <Pencil1Icon />
                    </Box>

                    <Text
                      variant="neutral"
                      size="1"
                      css={{
                        marginRight: 3,
                      }}
                    >
                      {"Inflation change:"}
                    </Text>
                    <Text
                      size="1"
                      css={{
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {formatPercentChange(inflationChange)}
                    </Text>
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  css={{
                    width: "200px",
                    mt: "$1",
                    boxShadow:
                      "0px 5px 14px rgba(0, 0, 0, 0.22), 0px 0px 2px rgba(0, 0, 0, 0.2)",
                    bc: "$neutral4",
                  }}
                  align="center"
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  placeholder={undefined}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      css={{
                        cursor: "pointer",
                      }}
                      onSelect={() => setInflationChange("none")}
                    >
                      {formatPercentChange("none")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      css={{
                        cursor: "pointer",
                      }}
                      onSelect={() => setInflationChange("positive")}
                    >
                      {formatPercentChange("positive")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      css={{
                        cursor: "pointer",
                      }}
                      onSelect={() => setInflationChange("negative")}
                    >
                      {formatPercentChange("negative")}
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </Box>
          </Flex>
        </Box>
      }
    />
  );
};

export default OrchestratorList;
