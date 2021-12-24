import Table from "@components/Table";
import { textTruncate } from "@lib/utils";
import { Badge, Box, Flex, Link as A } from "@livepeer/design-system";
import Link from "next/link";
import { useMemo } from "react";
import QRCode from "qrcode.react";

const PerformanceList = ({ data, pageSize = 10 }) => {
  const regions = {
    global: "Global",
    fra: "Frankfurt",
    lax: "Los Angeles",
    lon: "London",
    mdw: "Chicago",
    nyc: "New York City",
    prg: "Prague",
    sin: "Singapore",
  };

  const region = "Global";

  const initialState = {
    pageSize: 20,
    sortBy: [
      {
        id: "scores.global",
        desc: true,
      },
      {
        id: "scores.fra",
        desc: true,
      },
      {
        id: "scores.lax",
        desc: true,
      },
      {
        id: "scores.lon",
        desc: true,
      },
      {
        id: "scores.mdw",
        desc: true,
      },
      {
        id: "scores.nyc",
        desc: true,
      },
      {
        id: "scores.prg",
        desc: true,
      },
      {
        id: "scores.sin",
        desc: true,
      },
    ],
    hiddenColumns: [
      "activationRound",
      "deactivationRound",
      "threeBoxSpace",
      "global",
      "delegator",
      "ens",
      "username",
      "avatar",
    ],
  };

  const columns: any = useMemo(
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
        Header: "ENS",
        accessor: "ens",
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
        Header: "Activation Round",
        accessor: "activationRound",
      },
      {
        Header: "Deactivation Round",
        accessor: "deactivationRound",
      },
      {
        Header: "ThreeBoxSpace",
        accessor: "threeBoxSpace",
      },
      {
        Header: "Delegator",
        accessor: "delegator",
      },
      {
        Header: "Total Score (0-10)",
        accessor: `scores.${region}`,
        sortDescFirst: true,
        defaultCanSort: true,
        Cell: ({ row }) => {
          console.log(row);
          return <Box />;
        },
      },
      {
        Header: "Success Rate (%)",
        accessor: `successRates.${region}`,
      },
      {
        Header: "Latency Score (0-10)",
        accessor: `roundTripScores.${region}`,
      },
    ],
    [region]
  );
  return <Table data={data} columns={columns} initialState={initialState} />;
};

export default PerformanceList;
