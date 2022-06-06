import PopoverLink from "@components/PopoverLink";
import Table from "@components/Table";
import { calculateAnnualROI, textTruncate } from "@lib/utils";
import {
  Avatar,
  Badge,
  Box,
  Flex,
  IconButton,
  Link as A,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
  TextField,
  Tooltip,
} from "@livepeer/design-system";
import { MixerHorizontalIcon, DotsHorizontalIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import Link from "next/link";
import numeral from "numeral";
import { useMemo, useState } from "react";
import QRCode from "qrcode.react";
import { ChevronDownIcon } from "@modulz/radix-icons";

import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const OrchestratorList = ({ data, protocolData, pageSize = 10 }) => {
  const [principle, setPrinciple] = useState<number>(100);
  const maxSupplyTokens = useMemo(
    () => Math.floor(Number(protocolData?.totalSupply || 1e7)),
    [protocolData]
  );
  const formattedPrinciple = useMemo(
    () => numeral(Number(principle) || 100).format("0a"),
    [principle]
  );

  const columns = useMemo(
    () => [
      {
        Header: (
          <Tooltip
            multiline
            content={
              <Box>
                The account which is actively coordinating transcoders and
                receiving fees/rewards.
              </Box>
            }
          >
            <Box>Orchestrator</Box>
          </Tooltip>
        ),
        accessor: "id",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.id}/orchestrating`} passHref>
            <A
              css={{
                width: 325,
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
            <Tooltip
              multiline
              content={
                <Box>
                  The estimate of earnings over one year if you were to delegate{" "}
                  {formattedPrinciple} LPT to this orchestrator. This is based
                  on recent performance data and may differ from actual ROI.
                </Box>
              }
            >
              <Box>Forecasted ROI (1Y)</Box>
            </Tooltip>
            <Popover>
              <PopoverTrigger
                onClick={(e) => {
                  e.stopPropagation();
                }}
                asChild
              >
                <IconButton
                  aria-label="Change LPT rewards"
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
                  <MixerHorizontalIcon />
                </IconButton>
              </PopoverTrigger>
              <PopoverContent
                onClick={(e) => {
                  e.stopPropagation();
                }}
                css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
              >
                <Box
                  css={{
                    borderBottom: "1px solid $neutral6",
                    p: "$3",
                  }}
                >
                  <Text
                    variant="neutral"
                    size="1"
                    css={{
                      mb: "$2",
                      fontWeight: 600,
                      textTransform: "uppercase",
                    }}
                  >
                    Assuming a delegation of:
                  </Text>
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
                      max={`${Number(protocolData?.totalSupply || 1e7).toFixed(
                        0
                      )}`}
                    />
                  </Flex>
                </Box>
              </PopoverContent>
            </Popover>
          </Flex>
        ),
        sortIconAlignment: "start",
        accessor: (row) => {
          const pools = row.pools ?? [];
          const rewardCalls =
            pools.length > 0 ? pools.filter((r) => r?.rewardTokens).length : 0;
          const rewardCallRatio = rewardCalls / pools.length;

          const activation = dayjs.unix(row.activationTimestamp);

          const isNewlyActive = dayjs().diff(activation, "days") < 45;

          const roi = calculateAnnualROI({
            ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
            feeShare: Number(row.feeShare),
            lptPriceEth: Number(protocolData.lptPriceEth),

            yearlyRewardsToStakeRatio: Number(
              protocolData.yearlyRewardsToStakeRatio
            ),
            rewardCallRatio,
            rewardCut: Number(row.rewardCut),
            principle: Number(principle || 100),
            totalStake: Number(row.totalStake),
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
          };
        },
        id: "earnings",
        Cell: ({ row }) => {
          const isNewlyActive = useMemo(
            () => row.values.earnings.isNewlyActive,
            [row.values.earnings]
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
              `${numeral(row.values.earnings.rewardCalls).format(
                "0"
              )}/${numeral(row.values.earnings.rewardCallLength).format("0")}`,
            [
              row.values.earnings.rewardCalls,
              row.values.earnings.rewardCallLength,
            ]
          );
          const isLowRewardCallRatio = useMemo(
            () => row.values.earnings.rewardCallRatio < 0.9,
            [row.values.earnings.rewardCallRatio]
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
                  css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
                >
                  <Box
                    css={{
                      padding: "$3",
                    }}
                  >
                    <Box css={{}}>
                      <Text
                        variant="neutral"
                        size="1"
                        css={{
                          mb: "$2",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        Forecasted ROI (1Y)*
                      </Text>
                      <Box>
                        <Flex>
                          <Text
                            css={{
                              fontWeight: 600,
                              color: "$white",
                              mb: "$1",
                            }}
                            size="2"
                          >
                            LPT Rewards ({rewardCalls}):
                          </Text>
                          <Text
                            css={{
                              marginLeft: "auto",
                              display: "block",
                              fontWeight: 600,
                              color: isLowRewardCallRatio ? "$red11" : "$white",
                              mb: "$1",
                            }}
                            size="2"
                          >
                            {numeral(
                              row.values.earnings.roi.delegatorPercent.rewards
                            ).format("0.0%")}
                            {isLowRewardCallRatio ? "**" : ""}
                          </Text>
                        </Flex>
                        <Flex>
                          <Text
                            css={{
                              fontWeight: 600,
                              color: "$white",
                              mb: "$1",
                            }}
                            size="2"
                          >
                            Transcoder Fees:
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
                              row.values.earnings.roi.delegatorPercent.fees
                            ).format("0.0%")}
                          </Text>
                        </Flex>
                      </Box>
                    </Box>
                    {isLowRewardCallRatio && (
                      <Text
                        css={{
                          mt: "$1",
                          color: "$red11",
                        }}
                        size="1"
                      >
                        **This orchestrator has poor performance in redeeming
                        inflationary rewards.
                      </Text>
                    )}

                    <Text
                      css={{
                        mt: "$2",
                        pt: "$2",
                        borderTop: "1px solid $neutral6",
                      }}
                      variant="neutral"
                      size="1"
                    >
                      *Assuming a delegation of {formattedPrinciple} LPT, as
                      well as a constant fee cut of {feeCut} and reward cut of{" "}
                      {rewardCut}.
                    </Text>
                    <Text
                      variant="neutral"
                      css={{
                        mt: "$1",
                        fontStyle: "italic",
                        textDecoration: "none",
                      }}
                      size="1"
                    >
                      The fee/reward cut are subject to change every round. See
                      our{" "}
                      <Link
                        passHref
                        href="https://github.com/livepeer/explorer/blob/main/ROI.md"
                      >
                        <A>ROI documentation</A>
                      </Link>
                      .
                    </Text>
                  </Box>
                </PopoverContent>
              )}
            </Popover>
          );
        },
        sortType: (rowA, rowB) =>
          rowA.values.earnings.isNewlyActive
            ? -1
            : rowA.values.earnings.roi.delegatorPercent.fees +
              rowA.values.earnings.roi.delegatorPercent.rewards -
              (rowB.values.earnings.roi.delegatorPercent.fees +
                rowB.values.earnings.roi.delegatorPercent.rewards),
      },
      {
        Header: (
          <Tooltip
            multiline
            content={
              <Box>
                The total amount of stake currently delegated to this
                orchestrator.
              </Box>
            }
          >
            <Box>Delegated Stake</Box>
          </Tooltip>
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
          <Tooltip
            multiline
            content={
              <Box>
                The total fees this orchestrator has earned in the past 90
                calendar days.
              </Box>
            }
          >
            <Box>Trailing 90D Fees</Box>
          </Tooltip>
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
                  aria-label="Change LPT rewards"
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
                  p: "$3",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    mb: "$2",
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
                  p: "$3",
                  borderBottom: "1px solid $neutral6",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    mb: "$2",
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
    [protocolData, formattedPrinciple, principle, setPrinciple, maxSupplyTokens]
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
            id: "ninetyDayVolumeETH",
            desc: true,
          },
        ],
      }}
    />
  );
};

export default OrchestratorList;
