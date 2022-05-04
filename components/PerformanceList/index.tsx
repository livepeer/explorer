import Table from "@components/Table";
import { textTruncate } from "@lib/utils";
import { Badge, Box, Flex, Link as A } from "@livepeer/design-system";
import Link from "next/link";
import { useMemo } from "react";
import QRCode from "qrcode.react";

const PerformanceList = ({ data, pageSize = 10, region }) => {
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
      "identity",
      "global",
      "delegator",
    ],
  };

  const columns: any = useMemo(
    () => [
      {
        Header: "Orchestrator",
        accessor: "id",
        defaultCanSort: false,
        Cell: ({ row }, i) => (
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
            </A>
          </Link>
        ),
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
        Header: "Identity",
        accessor: "identity",
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
          if (
            typeof row.values[`scores.${region}`] === "undefined" ||
            row.values[`scores.${region}`] === null
          ) {
            return null;
          }
          return (
            <Box>{(row.values[`scores.${region}`] / 1000).toFixed(2)}</Box>
          );
        },
      },
      {
        Header: "Success Rate (%)",
        accessor: `successRates.${region}`,
        Cell: ({ row }) => {
          if (
            typeof row.values[`successRates.${region}`] === "undefined" ||
            row.values[`successRates.${region}`] === null
          ) {
            return null;
          }

          return <Box>{row.values[`successRates.${region}`].toFixed(2)}%</Box>;
        },
      },
      {
        Header: "Latency Score (0-10)",
        accessor: `roundTripScores.${region}`,
        Cell: ({ row }) => {
          if (
            typeof row.values[`roundTripScores.${region}`] === "undefined" ||
            row.values[`roundTripScores.${region}`] === null
          ) {
            return null;
          }
          return (
            <Box>
              {(row.values[`roundTripScores.${region}`] / 1000).toFixed(2)}
            </Box>
          );
        },
      },
    ],
    [region]
  );
  return <Table data={data} columns={columns} initialState={initialState} />;
};

export default PerformanceList;
