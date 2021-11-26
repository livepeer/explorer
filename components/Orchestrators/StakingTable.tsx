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
  Button,
} from "@livepeer/design-system";
import { useMemo } from "react";
import {
  DownloadIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";

function DataTable({ pageSize = 20, heading = null, data }) {
  const columns = useMemo(
    () => [
      {
        Header: "#",
        id: "rank",
        accessor: (row, i) => {
          return i + 1;
        },
        Cell: ({ row }) => (
          <Box css={{ width: "20px", display: "flex", alignItems: "center" }}>
            {+row.id + 1}
          </Box>
        ),
      },
      {
        Header: "Name",
        accessor: "username",
        Cell: ({ row }) => (
          <Link passHref href={`/accounts/${row.values.address}/orchestrating`}>
            <A>{row.values.username}</A>
          </Link>
        ),
      },
      {
        Header: "Address",
        accessor: "address",
        Cell: ({ row }) => (
          <Link
            passHref
            href={`https://explorer.livepeer.org/accounts/${row.values.address}/orchestrating`}
          >
            <A>
              {row.values.address.replace(row.values.address.slice(7, 37), "…")}
            </A>
          </Link>
        ),
      },
      {
        Header: "Start Date",
        id: "startDate",
        accessor: (row, i) => {
          return new Date(row.startDate * 1000).toLocaleDateString("en-us");
        },
        sortType: (a, b) => {
          return (
            Date.parse(a.values.startDate) - Date.parse(b.values.startDate)
          );
        },
      },
      {
        Header: "Reg. High Score",
        id: "currentHighScore",
        accessor: (row) =>
          row.currentHighScore != null
            ? row.currentHighScore.toLocaleString("en-US", {
                maximumFractionDigits: 4,
              })
            : "N/A",
        Cell: ({ row }) => (
          <Box>
            {row.values.currentHighScore != null
              ? row.values.currentHighScore.toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })
              : "N/A"}
          </Box>
        ),
      },
      {
        Header: "Avg Score",
        id: "averageScore",
        accessor: (row) =>
          row.averageScore != null
            ? row.averageScore.toLocaleString("en-US", {
                maximumFractionDigits: 4,
              })
            : "N/A",
        Cell: ({ row }) => (
          <Box>
            {row.values.averageScore != null
              ? row.values.averageScore.toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })
              : "N/A"}
          </Box>
        ),
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
            })}
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: "Self Stake",
        id: "selfStake",
        accessor: (row) =>
          parseFloat(row.selfStake).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
        Cell: ({ row }) => <Box>{row.values.selfStake}</Box>,
        sortType: "number",
      },
      {
        Header: "Delegated Stake",
        id: "pendingStake",
        accessor: (row) => {
          console.log(row);
          return row.pendingStake.toLocaleString("en-US", {
            maximumFractionDigits: 2,
          });
        },

        Cell: ({ row }) => <Box>{row.values.pendingStake}</Box>,
        sortType: "number",
      },
      {
        Header: "Reward Cut",
        accessor: "rewardCut",
        Cell: ({ row }) => <Box>{row.values.rewardCut}%</Box>,
        sortType: "number",
      },
      {
        Header: "Fee Cut",
        accessor: "feeCut",
        Cell: ({ row }) => <Box>{row.values.feeCut}%</Box>,
        sortType: "number",
      },
      {
        Header: "Total Fees (ETH)",
        id: "totalFees",
        accessor: (row) =>
          parseFloat(row.totalVolumeETH).toLocaleString("en-US", {
            maximumFractionDigits: 2,
          }),
        Cell: ({ row }) => <Box>{row.values.totalFees}</Box>,
        sortType: "number",
      },
      {
        Header: "Total Delegators",
        accessor: "totalDelegators",
        Cell: ({ row }) => <Box>{row.values.totalDelegators}</Box>,
      },
      {
        Header: "Reward Calls (30r)",
        id: "pools",
        accessor: (row) =>
          `${row.pools.filter((r) => r.rewardTokens != null).length} / ${
            row.pools.length
          }`,
      },
      {
        Header: "Call Ratio (30r)",
        id: "rewardCallRatioThirtyRounds",
        accessor: (row) =>
          (
            row.pools.filter((r) => r.rewardTokens != null).length /
            row.pools.length
          ).toFixed(2),
      },
    ],
    []
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data: data.transcoders,
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
        }}
      >
        <Table
          {...getTableProps()}
          css={{
            borderCollapse: "collapse",
            width: 1900,
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
                    <Box css={{ display: "flex", alignItems: "center" }}>
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
                          px: i === 0 ? "$5" : "$1",
                          width: i === 0 ? "40px" : i === 1 ? "100px" : "auto",
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
