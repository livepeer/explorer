import Table from "@components/Table";
import { textTruncate } from "@lib/utils";
import { Badge, Box, Flex, Link as A, Skeleton } from "@livepeer/design-system";
import Link from "next/link";
import { useMemo } from "react";
import QRCode from "qrcode.react";
import { useAllScoreData, useEnsData } from "hooks";
import { OrchestratorsQueryResult } from "apollo";
import { ALL_REGIONS } from "utils/allRegions";
import numeral from "numeral";

const EmptyData = () => <Skeleton css={{ height: 20, width: 100 }} />;

const PerformanceList = ({
  data,
  pageSize = 20,
  region,
}: {
  pageSize: number;
  region: keyof typeof ALL_REGIONS;
  data: Pick<OrchestratorsQueryResult["data"]["transcoders"][number], "id">[];
}) => {
  const allScores = useAllScoreData();
  const initialState = {
    pageSize: pageSize,
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

  const mergedData = useMemo(
    () => data.map((o) => ({ ...o, ...allScores?.[o?.id] })),
    [allScores, data]
  );

  const columns: any = useMemo(
    () => [
      {
        Header: "Orchestrator",
        accessor: "id",
        defaultCanSort: false,
        Cell: ({ row }, i) => {
          const identity = useEnsData(row.values.id);
          return (
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
                  {identity?.avatar ? (
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
                      src={identity.avatar}
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
                  {identity?.name ? (
                    <Flex css={{ fontWeight: 600, ai: "center" }}>
                      <Box
                        css={{
                          mr: "$2",
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
                </Flex>
              </A>
            </Link>
          );
        },
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
            return <EmptyData />;
          }
          return (
            <Box>
              {numeral(row.values[`scores.${region}`])
                .divide(10)
                .format("0.00")}
            </Box>
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
            return <EmptyData />;
          }

          return (
            <Box>
              {numeral(row.values[`successRates.${region}`])
                .divide(100)
                .format("0%")}
            </Box>
          );
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
            return <EmptyData />;
          }
          return (
            <Box>
              {numeral(row.values[`roundTripScores.${region}`])
                .divide(10)
                .format("0.00")}
            </Box>
          );
        },
      },
    ],
    [region]
  );
  return (
    <Table data={mergedData} columns={columns} initialState={initialState} />
  );
};

export default PerformanceList;
