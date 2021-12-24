import { useMemo } from "react";
import { Box, Flex, Badge, Link as A } from "@livepeer/design-system";
import Link from "next/link";
import Table from "@components/Table";
import { roundToTwo, textTruncate } from "@lib/utils";
import QRCode from "qrcode.react";

const OrchestratorList = ({ data, pageSize = 10 }) => {
  const columns = useMemo(
    () => [
      {
        Header: "Orchestrator",
        accessor: "address",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.address}/orchestrating`} passHref>
            <A
              css={{
                width: 300,
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
                {row.values.avatar ? (
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
                    src={`https://ipfs.infura.io/ipfs/${row.values.avatar}`}
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
                    fgColor={`#${row.values.address.substr(2, 6)}`}
                    value={row.values.address}
                  />
                )}
                {row.values.username ? (
                  <Flex css={{ fontWeight: 600, ai: "center" }}>
                    <Box
                      css={{
                        mr: "$2",
                        fontSize: "$3",
                      }}
                    >
                      {textTruncate(row.values.username, 12, "…")}
                    </Box>
                    <Badge size="2" css={{ fontSize: "$2" }}>
                      {row.values.ens.name
                        ? row.values.ens.name
                        : row.values.address.substring(0, 6)}
                    </Badge>
                  </Flex>
                ) : (
                  <Box css={{ fontWeight: 600 }}>
                    {row.values.ens.name
                      ? row.values.ens.name
                      : row.values.address.replace(
                          row.values.address.slice(7, 37),
                          "…"
                        )}
                  </Box>
                )}
              </Flex>
            </A>
          </Link>
        ),
      },
      {
        Header: "Username",
        accessor: "username",
      },
      {
        Header: "Avatar",
        accessor: "avatar",
      },
      {
        Header: "ENS",
        accessor: "ens",
      },
      {
        Header: "Total Fees",
        id: "totalFees",
        accessor: (row) =>
          parseFloat(row.totalVolumeETH).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
        Cell: ({ row }) => <Box>{row.values.totalFees} ETH</Box>,
        sortType: "number",
      },
      {
        Header: "Total Stake",
        id: "totalStake",
        accessor: (row) =>
          row.totalStake.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
        Cell: ({ row }) => (
          <Box>
            {row.values.totalStake.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}{" "}
            LPT
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: "Reward Cut",
        accessor: "rewardCut",
        Cell: ({ row }) => <Box>{roundToTwo(row.values.rewardCut)}%</Box>,
        sortType: "number",
      },
      {
        Header: "Fee Cut",
        accessor: "feeCut",
        Cell: ({ row }) => <Box>{roundToTwo(row.values.feeCut)}%</Box>,
        sortType: "number",
      },

      {
        Header: "Total Delegators",
        accessor: "totalDelegators",
        Cell: ({ row }) => <Box>{row.values.totalDelegators}</Box>,
      },
      {
        Header: "Reward Calls",
        id: "pools",
        accessor: (row) =>
          `${row.pools.filter((r) => r.rewardTokens != null).length} / ${
            row.pools.length
          }`,
      },
    ],
    []
  );
  return (
    <Table
      data={data}
      columns={columns}
      initialState={{
        pageSize,
        hiddenColumns: ["username", "avatar", "ens"],
      }}
    />
  );
};

export default OrchestratorList;
