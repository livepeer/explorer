import { ExplorerTooltip } from "@components/ExplorerTooltip";
import Table from "@components/Table";
import { Pipeline } from "@lib/api/types/get-available-pipelines";
import { Region } from "@lib/api/types/get-regions";
import { textTruncate } from "@lib/utils";
import { Badge, Box, Flex, Link as A, Skeleton } from "@livepeer/design-system";
import { QuestionMarkCircledIcon } from "@modulz/radix-icons";
import Link from "next/link";
import { useMemo } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { useAllScoreData, useEnsData } from "hooks";
import { OrchestratorsQueryResult } from "apollo";
import numbro from "numbro";

const EmptyData = () => <Skeleton css={{ height: 20, width: 100 }} />;

const PerformanceList = ({
  data,
  pageSize = 20,
  region,
  pipeline,
  model,
}: {
  pageSize: number;
  region: Region["id"];
  pipeline: Pipeline["id"] | null;
  model: string | null;
  data: Pick<
    NonNullable<OrchestratorsQueryResult["data"]>["transcoders"][number],
    "id"
  >[];
}) => {
  const { isValidating, data: allScores } = useAllScoreData(pipeline, model);
  const isAIData = pipeline !== null && model !== null;
  const scoreAccessor = `scores.${region}`; //total score
  const successRateAccessor = `successRates.${region}`; //success rate
  const roundTripScoreAccessor = `roundTripScores.${region}`; //latency score

  const initialState = {
    pageSize: pageSize,
    sortBy: [
      {
        id: "scores",
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

  //tanstack v7's numberic sorting function incorrectly treats 0, null, and undefined as 0 (the same value).
  //alphanumeric sorting does properly handle null and undefined values, but it unforunately doesn't always
  //sort double values correctly.  As such, we use a custom sort function to place 0 values after
  //non-zero's and before null/undefined values.
  const sortTypeFn = useMemo(
    () => (rowA: any, rowB: any, columnId: string) => {
      const a = rowA.values[columnId];
      const b = rowB.values[columnId];
      if (a === null || a === undefined) return -1;
      if (b === null || b === undefined) return 1;
      return a === b ? 0 : a > b ? 1 : -1;
    },
    []
  );

  const columns: any = useMemo(
    () => [
      {
        Header: "Rank",
        disableSortBy: true,
        Cell: ({ row, flatRows }) => {
          return <Box>{flatRows.indexOf(row) + 1}</Box>;
        },
      },
      {
        Header: () => (
          <>
            Orchestrator{" "}
            <Box
              css={{
                paddingLeft: "3px",
                "@bp1": { display: "none", paddingLeft: "0" },
              }}
            >
              (Score)
            </Box>
          </>
        ),
        accessor: "id",
        disableSortBy: true,
        Cell: ({ row }) => {
          const identity = useEnsData(row.values.id);
          return (
            <A
              as={Link}
              href={`/accounts/${row.values.id}/orchestrating`}
              passHref
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
                    key={row.values.id}
                    as="img"
                    css={{
                      marginRight: "$2",
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
                    css={{
                      marginRight: "$2",
                      borderRadius: 1000,
                      width: 24,
                      height: 24,
                      maxWidth: 24,
                      maxHeight: 24,
                      overflow: "hidden",
                    }}
                  >
                    <QRCodeCanvas
                      fgColor={`#${row.values.id.substr(2, 6)}`}
                      size={24}
                      value={row.values.id}
                    />
                  </Box>
                )}
                {identity?.name ? (
                  <Flex css={{ fontWeight: 600, alignItems: "center" }}>
                    <Box
                      css={{
                        marginRight: "$2",
                        fontSize: "$3",
                      }}
                    >
                      {textTruncate(identity.name, 20, "…")}
                    </Box>
                    <Badge
                      size="2"
                      css={{
                        fontSize: "$2",
                        display: "none",
                        "@bp1": {
                          display: "inherit",
                        },
                      }}
                    >
                      {row.values.id.substring(0, 6)}
                    </Badge>
                  </Flex>
                ) : (
                  <Box css={{ fontWeight: 600 }}>
                    {row.values.id.replace(row.values.id.slice(7, 37), "…")}
                  </Box>
                )}
                {typeof row.values.scores != "undefined" &&
                row.values.scores != null ? (
                  <Badge
                    size="2"
                    variant="green"
                    css={{
                      marginRight: "$2",
                      fontSize: "$1",
                      "@bp1": {
                        display: "none",
                      },
                    }}
                  >
                    {numbro(row.values.scores).divide(10).format({
                      mantissa: 2,
                    })}
                  </Badge>
                ) : null}
              </Flex>
            </A>
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
        Header: () => (
          <>
            Total Score (0-10){" "}
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  {isAIData
                    ? "The AI Total Score combines the Orchestrator's Latency Score and average Success Rate, with a higher emphasis on Success Rate."
                    : "The Transcoding Total Score is based on the Orchestrator's Latency Score and Success Rate."}
                </Box>
              }
            >
              <Flex css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Flex>
            </ExplorerTooltip>
          </>
        ),
        id: "scores",
        accessor: `${scoreAccessor}`,
        sortDescFirst: true,
        defaultCanSort: true,
        sortType: sortTypeFn,
        Cell: ({ value }) => {
          if (isValidating) {
            return <EmptyData />;
          }
          return (
            <Box>
              {typeof value === "undefined" || value === null
                ? "---"
                : numbro(value).divide(10).format({
                  mantissa: 2,
                })}
            </Box>
          );
        },
      },
      {
        Header: () => (
          <>
            Success Rate (%){" "}
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  The rate at which the Orchestrator successfully completed a
                  job.
                </Box>
              }
            >
              <Flex css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Flex>
            </ExplorerTooltip>
          </>
        ),
        accessor: `${successRateAccessor}`,
        sortType: sortTypeFn,
        Cell: ({ value }) => {
          if (isValidating) {
            return <EmptyData />;
          }
          return (
            <Box>
              {typeof value === "undefined" || value === null
                ? "---"
                : numbro(value).divide(100).format({
                  output: "percent",
                  mantissa: 0,
                })}
            </Box>
          );
        },
      },
      {
        Header: () => (
          <>
            Latency Score (0-10){" "}
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  {isAIData
                    ? "AI Latency Score represents the Orchestrator's average round trip time (RTT) compared to the median RTT of successful jobs."
                    : "The Transcoding Latency Score represents the average test segment duration compared to the round trip time of the request."}
                </Box>
              }
            >
              <Flex css={{ marginLeft: "$1" }}>
                <Box
                  as={QuestionMarkCircledIcon}
                  css={{ color: "$neutral11" }}
                />
              </Flex>
            </ExplorerTooltip>
          </>
        ),
        accessor: `${roundTripScoreAccessor}`,
        sortType: sortTypeFn,
        Cell: ({ value }) => {
          if (isValidating) {
            return <EmptyData />;
          }
          return (
            <Box>
              {typeof value === "undefined" || value === null
                ? "---"
                : numbro(value).divide(10).format({
                  mantissa: 2,
                })}
            </Box>
          );
        },
      },
    ],
    [
      isAIData,
      isValidating,
      roundTripScoreAccessor,
      scoreAccessor,
      sortTypeFn,
      successRateAccessor,
    ]
  );
  return (
    <Table data={mergedData} columns={columns} initialState={initialState} />
  );
};

export default PerformanceList;
