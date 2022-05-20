import { useMemo } from "react";
import {
  Box,
  Flex,
  Badge,
  Link as A,
  Avatar,
  Tooltip,
  IconButton,
  Popover,
  Text,
  PopoverContent,
  PopoverTrigger,
  TextField,
} from "@livepeer/design-system";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import Table from "@components/Table";
import { calculateAnnualROI, textTruncate } from "@lib/utils";
import { ethers } from "ethers";
import numeral from "numeral";
import useForm from "react-hook-form";

const avatarColors = [
  "tomato",
  "red",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "grass",
  "brown",
  "bronze",
  "gold",
  "sky",
  "mint",
  "lime",
  "yellow",
  "amber",
  "orange",
] as const;

const OrchestratorList = ({ data, protocolData, pageSize = 10 }) => {
  const { register, watch } = useForm();
  const principle = watch("principle");

  const columns = useMemo(
    () => [
      {
        Header: "#",
        accessor: "id",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.id}/orchestrating`} passHref>
            <A
              css={{
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
              }}
            >
              <Flex css={{ alignItems: "center" }}>
                <Box
                  css={{
                    color: "$white",
                    fontWeight: 400,
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    fontSize: 12,
                    justifyContent: "flex-start",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {+row.id + 1}
                </Box>
              </Flex>
            </A>
          </Link>
        ),
      },
      {
        Header: "Orchestrator",
        accessor: "identity",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.id}/orchestrating`} passHref>
            <A
              css={{
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
              }}
            >
              <Flex css={{ alignItems: "center" }}>
                <Box
                  css={{
                    mr: "$2",
                    borderRadius: "50%",
                    borderColor: "$white",
                    borderWidth: 1,
                    borderStyle: "solid",
                    padding: 2,
                  }}
                >
                  {row.values.identity?.image ? (
                    <Box
                      as="img"
                      css={{
                        width: 25,
                        height: 25,
                        borderRadius: "50%",
                        display: "block",
                      }}
                      src={row.values.identity.image}
                    />
                  ) : (
                    <Avatar
                      size="2"
                      variant={
                        avatarColors[
                          ethers.BigNumber.from(row.values.id)
                            .mod(avatarColors.length)
                            .toNumber()
                        ]
                      }
                      color={row.values.id.substr(2, 6)}
                      alt={row.values.id}
                      fallback={row.values.id.slice(2, 3)}
                    />
                  )}
                </Box>
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
            </A>
          </Link>
        ),
      },
      {
        Header: (
          <Flex css={{ flexDirection: "row", alignItems: "center" }}>
            <Box css={{}}>Projected Earnings (1Y)</Box>
            <Popover>
              <PopoverTrigger asChild>
                <IconButton
                  aria-label="Copy code to clipboard"
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
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MixerHorizontalIcon />
                </IconButton>
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
                      ref={register}
                      name="principle"
                      placeholder="Amount in LPT"
                      type="number"
                      size="2"
                      defaultValue={100}
                    />
                  </Flex>
                </Box>
              </PopoverContent>
            </Popover>
          </Flex>
        ),
        accessor: (row) => {
          const pools = row.pools ?? [];
          const rewardCallRatio =
            pools.length > 0
              ? pools.filter((r) => r?.rewardTokens).length / pools.length
              : 0;

          // console.log({ row, principle });

          const roi = calculateAnnualROI({
            successRate: Number(row.successRates.global) / 100,
            ninetyDayVolumeETH: Number(row.ninetyDayVolumeETH),
            feeShare: Number(row.feeShare),
            lptPriceEth: Number(protocolData.lptPriceEth),

            yearlyRewardsToStakeRatio: Number(
              protocolData.yearlyRewardsToStakeRatio
            ),
            rewardCallRatio: rewardCallRatio,
            rewardCut: Number(row.rewardCut),
            principle: Number(principle || 100),
            totalStake: Number(row.totalStake),
          });

          return roi;
        },
        id: "projectedEarningsAPY",
        Cell: ({ row }) => (
          <Popover>
            <PopoverTrigger asChild>
              <Badge
                size="2"
                css={{ cursor: "pointer", color: "$white", fontSize: "$2" }}
              >
                {numeral(
                  row.values.projectedEarningsAPY.fees +
                    row.values.projectedEarningsAPY.rewards
                ).format("0.0%")}
              </Badge>
            </PopoverTrigger>
            <PopoverContent
              css={{ width: 300, borderRadius: "$4", bc: "$neutral4" }}
            >
              <Box
                css={{
                  padding: "$3",
                }}
              >
                <Box
                  css={{
                    borderBottom: "1px solid $neutral6",
                    mb: "$2",
                    pb: "$2",
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
                    PROJECTED EARNINGS (1Y)*
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
                        LPT Rewards:
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
                          row.values.projectedEarningsAPY.rewards
                        ).format("0.0%")}
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
                        ETH Transcoding Fees:
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
                        {numeral(row.values.projectedEarningsAPY.fees).format(
                          "0.0%"
                        )}
                      </Text>
                    </Flex>
                  </Box>
                </Box>

                <Text variant="neutral" size="1">
                  *Assuming a delegation of{" "}
                  {(Number(principle) || 100).toFixed(0)} LPT
                </Text>
              </Box>
            </PopoverContent>
          </Popover>
        ),
        sortType: (rowA, rowB) =>
          rowA.values.projectedEarningsAPY.fees +
          rowA.values.projectedEarningsAPY.rewards -
          (rowB.values.projectedEarningsAPY.fees +
            rowB.values.projectedEarningsAPY.rewards),
      },
      {
        Header: "Delegated Stake",
        accessor: "totalStake",
        Cell: ({ row }) => (
          <Box>{numeral(row.values.totalStake).format("0.0a")} LPT</Box>
        ),
        sortType: "number",
      },
      {
        Header: "30D Fees",
        accessor: "thirtyDayVolumeETH",
        Cell: ({ row }) => (
          <Box>{numeral(row.values.thirtyDayVolumeETH).format("0.0a")} ETH</Box>
        ),
        sortType: "number",
      },
    ],
    [protocolData, principle, register]
  );

  console.log({ principle });

  return (
    <Table
      data={data}
      columns={columns}
      initialState={{
        pageSize,
        sortBy: [
          {
            id: "thirtyDayVolumeETH",
            desc: true,
          },
        ],
      }}
    />
  );
};

export default OrchestratorList;
