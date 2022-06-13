import PopoverLink from "@components/PopoverLink";
import Table from "@components/Table";
import { textTruncate } from "@lib/utils";
import {
  Badge,
  Box,
  Button,
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
  DotsHorizontalIcon,
  Pencil1Icon,
  ChevronDownIcon,
} from "@radix-ui/react-icons";
import dayjs from "dayjs";
import Link from "next/link";
import numeral from "numeral";
import { useCallback, useMemo, useState } from "react";
import QRCode from "qrcode.react";

import YieldChartIcon from "../../public/img/yield-chart.svg";

import relativeTime from "dayjs/plugin/relativeTime";
import { calculateROI, ROIInflationChange, ROITimeHorizon } from "@lib/roi";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import { ExplorerTooltip } from "@components/ExplorerTooltip";

dayjs.extend(relativeTime);

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

const OrchestratorList = ({ data, protocolData, pageSize = 10 }) => {
  const formatPercentChange = useCallback(
    (change: ROIInflationChange) =>
      change === "none"
        ? `Fixed at ${numeral(
            Number(protocolData.inflation) / 1000000000
          ).format("0.000%")}`
        : change === "positive"
        ? `+${numeral(Number(protocolData.inflationChange) / 1000000000).format(
            "0.00000%"
          )} per round`
        : `-${numeral(Number(protocolData.inflationChange) / 1000000000).format(
            "0.00000%"
          )} per round`,
    [protocolData?.inflation, protocolData?.inflationChange]
  );

  const [principle, setPrinciple] = useState<number>(150);
  const [inflationChange, setInflationChange] =
    useState<ROIInflationChange>("none");
  const [timeHorizon, setTimeHorizon] = useState<ROITimeHorizon>("one-year");
  const maxSupplyTokens = useMemo(
    () => Math.floor(Number(protocolData?.totalSupply || 1e7)),
    [protocolData]
  );
  const formattedPrinciple = useMemo(
    () => numeral(Number(principle) || 150).format("0a"),
    [principle]
  );

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
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.id}/orchestrating`} passHref>
            <A
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
                    mr: "$2",
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

                <Flex css={{ mr: "$2", alignItems: "center" }}>
                  {row.values.identity?.image ? (
                    <Box
                      as="img"
                      css={{
                        mr: "$2",
                        width: 24,
                        height: 24,
                        maxWidth: 24,
                        maxHeight: 24,
                        borderRadius: 1000,
                      }}
                      src={row.values.identity.image}
                    />
                  ) : (
                    <Box
                      as={QRCode}
                      css={{
                        mr: "$2",
                        borderRadius: 1000,
                        width: 24,
                        height: 24,
                        maxWidth: 24,
                        maxHeight: 24,
                      }}
                      fgColor={`#${row.values.id.substr(2, 6)}`}
                      value={row.values.id}
                    />
                  )}
                  {row.values.identity?.name ? (
                    <Flex css={{ fontWeight: 600, ai: "center" }}>
                      <Box
                        css={{
                          mr: "$2",
                          fontSize: "$3",
                        }}
                      >
                        {textTruncate(row.values.identity.name, 20, "…")}
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
                </Flex>
              </Flex>
            </A>
          </Link>
        ),
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
                  differ from actual ROI.
                </Box>
              }
            >
              <Box>Forecasted Yield</Box>
            </ExplorerTooltip>
          </Flex>
        ),
        accessor: (row) => {
          const pools = row.pools ?? [];
          const rewardCalls =
            pools.length > 0 ? pools.filter((r) => r?.rewardTokens).length : 0;
          const rewardCallRatio = rewardCalls / pools.length;

          const activation = dayjs.unix(row.activationTimestamp);

          const isNewlyActive = dayjs().diff(activation, "days") < 45;

          const roi = calculateROI({
            inputs: {
              principle: Number(principle),
              timeHorizon,
              inflationChange,
            },
            orchestratorParams: {
              totalStake: Number(row.totalStake),
            },
            feeParams: {
              ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
              feeShare: Number(row.feeShare) / 1000000,
              lptPriceEth: Number(protocolData.lptPriceEth),
            },
            rewardParams: {
              inflation: Number(protocolData.inflation) / 1000000000,
              inflationChangePerRound:
                Number(protocolData.inflationChange) / 1000000000,
              totalSupply: Number(protocolData.totalSupply),
              totalActiveStake: Number(protocolData.totalActiveStake),
              roundLength: Number(protocolData.roundLength),

              rewardCallRatio,
              rewardCut: Number(row.rewardCut) / 1000000,
            },
          });

          return {
            roi,
            activation,
            isNewlyActive,
            rewardCalls,
            rewardCallLength: pools.length,
            rewardCallRatio,
            feeShare: row.feeShare,
            rewardCut: row.rewardCut,
            ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
            totalActiveStake: Number(protocolData.totalActiveStake),
            totalStake: Number(row.totalStake),
          };
        },
        id: "earnings",
        Cell: ({ row }) => {
          const isNewlyActive = useMemo(
            () => row.values.earnings.isNewlyActive,
            [row.values?.earnings?.isNewlyActive]
          );
          const feeCut = useMemo(
            () =>
              numeral(
                1 - Number(row.values.earnings.feeShare) / 1000000
              ).format("0%"),
            [row.values.earnings.feeShare]
          );
          const rewardCut = useMemo(
            () =>
              numeral(Number(row.values.earnings.rewardCut) / 1000000).format(
                "0%"
              ),
            [row.values.earnings.rewardCut]
          );
          const rewardCalls = useMemo(
            () =>
              `${numeral(row.values.earnings.rewardCalls)
                .divide(row.values.earnings.rewardCallLength)
                .format("0%")}`,
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
                        {numeral(
                          row.values.earnings.roi.delegatorPercent.fees +
                            row.values.earnings.roi.delegatorPercent.rewards
                        ).format("0.0%")}
                      </Box>
                      <Box css={{ ml: "$1" }}>
                        <ChevronDownIcon />
                      </Box>
                    </>
                  )}
                </Badge>
              </PopoverTrigger>
              {!isNewlyActive && (
                <PopoverContent
                  css={{ minWidth: 300, borderRadius: "$4", bc: "$neutral4" }}
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
                          mb: "$2",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        Yield (1Y)
                      </Text>

                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            mb: "$1",
                          }}
                          size="2"
                        >
                          Rewards (
                          {numeral(
                            row.values.earnings.roi.delegatorPercent.rewards
                          ).format("0.0%")}
                          ):
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(
                            row.values.earnings.roi.delegator.rewards
                          ).format("0.0")}
                          {" LPT"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            mb: "$1",
                          }}
                          size="2"
                        >
                          Fees (
                          {numeral(
                            row.values.earnings.roi.delegatorPercent.fees
                          ).format("0.0%")}
                          ):
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(
                            row.values.earnings.roi.delegator.fees
                          ).format("0.0")}
                          {" ETH"}
                        </Text>
                      </Flex>
                      <Link
                        passHref
                        href="https://docs.livepeer.org/delegators/how-to-guides/yield-calculation"
                      >
                        <A>
                          <Flex
                            css={{
                              mt: "$2",
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
                              css={{ ml: "$1", width: 15, height: 15 }}
                              as={ArrowTopRightIcon}
                            />
                          </Flex>
                        </A>
                      </Link>
                    </Box>

                    <Box
                      css={{
                        mt: "$3",
                        pt: "$3",
                        borderTop: "1px solid $neutral6",
                      }}
                    >
                      <Text
                        size="1"
                        css={{
                          mb: "$2",
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
                            mb: "$1",
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
                            mb: "$1",
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
                            mb: "$1",
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
                            mb: "$1",
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
                            mb: "$1",
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
                            mb: "$1",
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
                            mb: "$1",
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
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(
                            row.values.earnings.ninetyDayVolumeETH
                          ).format("0.0")}
                          {" ETH"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            mb: "$1",
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
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(row.values.earnings.totalStake).format(
                            "0.0a"
                          )}
                          {" LPT"}
                        </Text>
                      </Flex>
                    </Box>

                    <Box
                      css={{
                        mt: "$3",
                        pt: "$3",
                        borderTop: "1px solid $neutral6",
                      }}
                    >
                      <Text
                        size="1"
                        css={{
                          mb: "$2",
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
                            mb: "$1",
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
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(AVERAGE_L1_BLOCK_TIME).format("0")}
                          {" seconds"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            mb: "$1",
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
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(
                            row.values.earnings.roi.params.roundsCount
                          ).format("0")}
                          {" rounds"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            mb: "$1",
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
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(row.values.earnings.totalActiveStake).format(
                            "0.0a"
                          )}
                          {" LPT"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            mb: "$1",
                          }}
                          size="2"
                        >
                          Total inflation
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            mb: "$1",
                          }}
                          size="2"
                        >
                          {numeral(
                            row.values.earnings.roi.params.totalInflationPercent
                          ).format("0.0%")}
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
              {numeral(row.values.totalStake).format("0.00a")} LPT
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
              {numeral(row.values.ninetyDayVolumeETH).format("0.0a")} ETH
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
              <Flex css={{ ai: "center" }}>
                <IconButton
                  aria-label="Orchestrator actions"
                  css={{
                    cursor: "pointer",
                    ml: "$1",
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
              onClick={(e) => {
                e.stopPropagation();
              }}
              css={{ borderRadius: "$4", bc: "$neutral4" }}
            >
              <Box
                css={{
                  borderBottom: "1px solid $neutral6",
                  px: "$1",
                  pt: "$1",
                  pb: "$2",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    ml: "$3",
                    my: "$2",
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
                  p: "$1",
                  borderBottom: "1px solid $neutral6",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    ml: "$3",
                    my: "$2",
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
    [protocolData, formattedPrinciple, principle, inflationChange, timeHorizon]
  );

  return (
    <Table
      data={data}
      columns={columns}
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
        <Box css={{ mb: "$2" }}>
          <Flex css={{ alignItems: "center", mb: "$2" }}>
            <Box css={{ mr: "$1", color: "$neutral11" }}>
              <YieldChartIcon />
            </Box>
            <Text
              variant="neutral"
              size="1"
              css={{
                ml: "$1",
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
                  <Box css={{ mr: "$1" }}>
                    <Pencil1Icon />
                  </Box>

                  <Text
                    variant="neutral"
                    size="1"
                    css={{
                      mr: 3,
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
            <Box css={{ ml: "$1" }}>
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
                    <Box css={{ mr: "$1" }}>
                      <Pencil1Icon />
                    </Box>
                    <Text
                      variant="neutral"
                      size="1"
                      css={{
                        mr: 3,
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
                      {numeral(principle).format("0.0a")}
                      {" LPT"}
                    </Text>
                  </Badge>
                </PopoverTrigger>
                <PopoverContent
                  css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
                >
                  <Box
                    css={{
                      borderBottom: "1px solid $neutral6",
                      p: "$3",
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
                          ml: "$2",
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
            <Box css={{ ml: "$1" }}>
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
                    <Box css={{ mr: "$1" }}>
                      <Pencil1Icon />
                    </Box>

                    <Text
                      variant="neutral"
                      size="1"
                      css={{
                        mr: 3,
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
