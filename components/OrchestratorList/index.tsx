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
        accessor: "id",
        Cell: ({ row }) => (
          <Link href={`/accounts/${row.values.id}/orchestrating`} passHref>
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
                {row.values.threeBoxSpace?.image ? (
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
                    src={`https://ipfs.infura.io/ipfs/${row.values.threeBoxSpace.image}`}
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
                {row.values.threeBoxSpace?.name ? (
                  <Flex css={{ fontWeight: 600, ai: "center" }}>
                    <Box
                      css={{
                        mr: "$2",
                        fontSize: "$3",
                      }}
                    >
                      {textTruncate(row.values.threeBoxSpace.name, 12, "…")}
                    </Box>
                    <Badge size="2" css={{ fontSize: "$2" }}>
                      {row.values?.ens?.name
                        ? row.values.ens.name
                        : row.values.id.substring(0, 6)}
                    </Badge>
                  </Flex>
                ) : (
                  <Box css={{ fontWeight: 600 }}>
                    {row.values?.ens?.name
                      ? row.values.ens.name
                      : row.values.id.replace(row.values.id.slice(7, 37), "…")}
                  </Box>
                )}
              </Flex>
            </A>
          </Link>
        ),
      },
      {
        Header: "ENS",
        accessor: "ens",
      },
      {
        Header: "ThreeBoxSpace",
        accessor: "threeBoxSpace",
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
        accessor: "totalStake",
        Cell: ({ row }) => (
          <Box>
            {parseFloat(row.values.totalStake).toLocaleString("en-US", {
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
        Cell: ({ row }) => (
          <Box>{roundToTwo(parseInt(row.values.rewardCut, 10) / 10000)}%</Box>
        ),
        sortType: "number",
      },
      {
        Header: "Fee Cut",
        accessor: "feeShare",
        Cell: ({ row }) => (
          <Box>
            {roundToTwo(100 - parseInt(row.values.feeShare, 10) / 10000)}%
          </Box>
        ),
        sortType: "number",
      },

      {
        Header: "Total Delegators",
        accessor: (row) => row.delegators.length,
        sortType: "number",
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
        hiddenColumns: ["threeBoxSpace", "ens"],
      }}
    />
  );
};

export default OrchestratorList;
