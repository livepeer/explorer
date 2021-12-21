import { useTable, useSortBy } from "react-table";
import {
  Flex,
  Box,
  Link as A,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from "@livepeer/design-system";
import { useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { roundToTwo, textTruncate } from "@lib/utils";

function DataTable({ heading = "", data }) {
  const columns = useMemo(
    () => [
      {
        Header: "Orchestrator",
        accessor: "address",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.address}/orchestrating`} passHref>
            <A variant="subtle" css={{ width: 220, display: "block" }}>
              <Flex css={{ alignItems: "center" }}>
                <Box
                  css={{
                    mr: "$2",
                    backgroundColor: "$neutral4",
                    borderRadius: 1000,
                    width: 24,
                    color: "$neutral10",
                    fontWeight: 700,
                    height: 24,
                    fontSize: 11,
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {+row.id + 1}
                </Box>
                {row.values.username ? (
                  <Flex css={{ fontWeight: 600, ai: "center" }}>
                    <Box
                      css={{
                        mr: "$2",
                      }}
                    >
                      {textTruncate(row.values.username, 12, "…")}
                    </Box>
                    <Badge size="2" css={{ fontSize: "$2", fontWeight: 500 }}>
                      {row.values.ens.name
                        ? row.values.ens.name
                        : row.values.address.substring(0, 6)}
                    </Badge>
                  </Flex>
                ) : (
                  <Box css={{ fontWeight: 500 }}>
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
        Header: "ENS",
        accessor: "ens",
      },
      // {
      //   Header: "Start Date",
      //   id: "startDate",
      //   accessor: (row, i) => {
      //     return new Date(row.startDate * 1000).toLocaleDateString("en-us");
      //   },
      //   sortType: (a, b) => {
      //     return (
      //       Date.parse(a.values.startDate) - Date.parse(b.values.startDate)
      //     );
      //   },
      // },
      // {
      //   Header: "Reg. High Score",
      //   id: "currentHighScore",
      //   accessor: (row) =>
      //     row.currentHighScore != null
      //       ? row.currentHighScore.toLocaleString("en-US", {
      //           maximumFractionDigits: 4,
      //         })
      //       : "N/A",
      //   Cell: ({ row }) => (
      //     <Box>
      //       {row.values.currentHighScore != null
      //         ? row.values.currentHighScore.toLocaleString("en-US", {
      //             maximumFractionDigits: 4,
      //           })
      //         : "N/A"}
      //     </Box>
      //   ),
      // },
      // {
      //   Header: "Global Score",
      //   id: "averageScore",
      //   accessor: (row) =>
      //     row.averageScore != null
      //       ? row.averageScore.toLocaleString("en-US", {
      //           maximumFractionDigits: 4,
      //         })
      //       : "N/A",
      //   Cell: ({ row }) => (
      //     <Box>
      //       {row.values.averageScore != null
      //         ? row.values.averageScore.toLocaleString("en-US", {
      //             maximumFractionDigits: 4,
      //           })
      //         : "N/A"}
      //     </Box>
      //   ),
      // },
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
      // {
      //   Header: "Self Stake",
      //   id: "selfStake",
      //   accessor: (row) =>
      //     parseFloat(row.selfStake).toLocaleString("en-US", {
      //       maximumFractionDigits: 2,
      //     }),
      //   Cell: ({ row }) => <Box>{row.values.selfStake}</Box>,
      //   sortType: "number",
      // },
      // {
      //   Header: "Delegated Stake",
      //   id: "delegatedStake",
      //   accessor: (row) =>
      //     row.delegatedStake.toLocaleString("en-US", {
      //       maximumFractionDigits: 2,
      //     }),
      //   Cell: ({ row }) => <Box>{row.values.delegatedStake}</Box>,
      //   sortType: "number",
      // },
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

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data,
        initialState: {
          hiddenColumns: ["username", "ens"],
        },
      },
      useSortBy
    );

  // Render the UI for your table
  return (
    <>
      <Flex align="center" css={{ jc: "space-between" }}>
        {heading}
      </Flex>
      <Box
        css={{
          overflowY: "scroll",
          backgroundImage: `linear-gradient(to right, var(--colors-loContrast), var(--colors-loContrast)), linear-gradient(to right, var(--colors-loContrast), var(--colors-loContrast)), linear-gradient(to right, rgba(0, 0, 20, .05), rgba(255, 255, 255, 0)), linear-gradient(to left, rgba(0, 0, 20, .05), rgba(255, 255, 255, 0))`,
          /* Shadows */
          /* Shadow covers */
          backgroundPosition:
            "left center, right center, left center, right center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "20px 100%, 20px 100%, 10px 100%, 10px 100%",
          backgroundAttachment: "local, local, scroll, scroll",
          borderRadius: "$3",
          border: "1px solid $colors$neutral4",
        }}
      >
        <Table
          {...getTableProps()}
          css={{
            backgroundColor: "$panel",
            borderCollapse: "collapse",
            tableLayout: "auto",
          }}
        >
          <Thead>
            {headerGroups.map((headerGroup) => (
              <Tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any, i) => (
                  <Th
                    {...column.getHeaderProps(
                      column.getSortByToggleProps({ title: undefined })
                    )}
                    css={{
                      px: i === 0 ? "$5" : 0,
                      width: i === 0 ? "40px" : "auto",
                    }}
                  >
                    <Box
                      css={{
                        fontSize: 11,
                        color: "$neutral10",
                        display: "flex",
                        pt: "$2",
                        alignItems: "center",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {column.render("Header")}
                      <Box css={{ minWidth: 20 }}>
                        {column.isSorted ? (
                          column.isSortedDesc ? (
                            <ChevronDownIcon />
                          ) : (
                            <ChevronUpIcon />
                          )
                        ) : (
                          ""
                        )}
                      </Box>
                    </Box>
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody {...getTableBodyProps()}>
            {rows.map((row, _i) => {
              prepareRow(row);
              return (
                <Tr {...row.getRowProps()}>
                  {row.cells.map((cell, i) => {
                    return (
                      <Td
                        {...cell.getCellProps()}
                        css={{
                          fontSize: "$2",
                          lineHeight: 2,
                          px: i === 0 ? "$5" : "$1",
                          width: i === 0 ? "40px" : "auto",
                        }}
                      >
                        {cell.render("Cell")}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </>
  );
}

export default DataTable;
