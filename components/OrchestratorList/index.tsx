import { ExplorerTooltip } from "@components/ExplorerTooltip";
import IdentityAvatar from "@components/IdentityAvatar";
import Table from "@components/Table";
import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import { formatTimeHorizon } from "@lib/roi";
import { textTruncate } from "@lib/utils";
import {
  Badge,
  Box,
  Flex,
  Link as A,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { OrchestratorsQueryResult, ProtocolQueryResult } from "apollo";
import { useEnsData } from "hooks";
import { useOrchestratorRowViewModel } from "hooks/useOrchestratorRowViewModel";
import { useOrchestratorViewModel } from "hooks/useOrchestratorViewModel";
import Link from "next/link";
import numbro from "numbro";
import { useMemo } from "react";
import { Row } from "react-table";
import { useWindowSize } from "react-use";

import { OrchestratorActionsMenu } from "./OrchestratorActionsMenu";
import { OrchestratorCard } from "./OrchestratorCard";
import { YieldAssumptionsControls } from "./YieldAssumptionsControls";

const OrchestratorList = ({
  data,
  protocolData,
  pageSize = 10,
}: {
  pageSize: number;
  protocolData:
    | NonNullable<ProtocolQueryResult["data"]>["protocol"]
    | undefined;
  data:
    | NonNullable<OrchestratorsQueryResult["data"]>["transcoders"]
    | undefined;
}) => {
  const {
    filters,
    setPrinciple,
    setTimeHorizon,
    setFactors,
    setInflationChange,
    mappedData,
    formattedPrinciple,
    maxSupplyTokens,
    formatPercentChange,
  } = useOrchestratorViewModel({ data, protocolData });

  const { principle, timeHorizon, factors, inflationChange } = filters;

  const columns = useMemo(
    () => [
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The account which is actively coordinating transcoders and
                receiving fees/rewards.
              </Box>
            }
          >
            <Box>Orchestrator</Box>
          </ExplorerTooltip>
        ),
        accessor: "id",
        Cell: ({ row }) => {
          const identity = useEnsData(row.values.id);

          return (
            <A
              as={Link}
              href={`/accounts/${row.values.id}/orchestrating`}
              passHref
              css={{
                width: 350,
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
              }}
            >
              <Flex css={{ alignItems: "center" }}>
                <Box
                  css={{
                    marginRight: "$2",
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

                <Flex css={{ marginRight: "$2", alignItems: "center" }}>
                  <IdentityAvatar
                    identity={identity}
                    address={row.values.id}
                    css={{ marginRight: "$2" }}
                  />
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
                      <Badge size="2" css={{ fontSize: "$2" }}>
                        {row.values.id.substring(0, 6)}
                      </Badge>
                    </Flex>
                  ) : (
                    <Box css={{ fontWeight: 600 }}>
                      {row.values.id.replace(row.values.id.slice(7, 37), "…")}
                    </Box>
                  )}
                  {/* {(row?.original?.daysSinceChangeParams ??
                      Number.MAX_VALUE) < 30 && (
                      <ExplorerTooltip
                        multiline
                        content={`This orchestrator changed their fee or reward cut ${row?.original?.daysSinceChangeParamsFormatted}.`}
                      >
                        <Box>
                          <Box
                            as={ExclamationTriangleIcon}
                            css={{ ml: "$2", color: "$neutral11" }}
                          />
                        </Box>
                      </ExplorerTooltip>
                    )} */}
                </Flex>
              </Flex>
            </A>
          );
        },
      },
      {
        Header: "Identity",
        accessor: "identity",
      },
      {
        Header: (
          <Flex css={{ flexDirection: "row", alignItems: "center" }}>
            <ExplorerTooltip
              multiline
              content={
                <Box>
                  The estimate of earnings over {formatTimeHorizon(timeHorizon)}{" "}
                  if you were to delegate {formattedPrinciple} LPT to this
                  orchestrator. This is based on recent performance data and may
                  differ from actual yield.
                </Box>
              }
            >
              <Box>Forecasted Yield</Box>
            </ExplorerTooltip>
          </Flex>
        ),
        accessor: (row) => row.earningsComputed,
        id: "earnings",
        Cell: ({ row }) => {
          const { feeCut, rewardCut, rewardCalls, isNewlyActive } =
            useOrchestratorRowViewModel(row.values.earnings);

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
                        {numbro(
                          row.values.earnings.roi.delegatorPercent.fees +
                            row.values.earnings.roi.delegatorPercent.rewards
                        ).format({ mantissa: 1, output: "percent" })}
                      </Box>
                      <Box css={{ marginLeft: "$1" }}>
                        <ChevronDownIcon />
                      </Box>
                    </>
                  )}
                </Badge>
              </PopoverTrigger>
              {!isNewlyActive && (
                <PopoverContent
                  css={{ minWidth: 300, borderRadius: "$4", bc: "$neutral4" }}
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                  placeholder={undefined}
                >
                  <Box
                    css={{
                      padding: "$4",
                    }}
                  >
                    <Box css={{}}>
                      <Text
                        size="1"
                        css={{
                          marginBottom: "$2",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {`Yield (${formatTimeHorizon(timeHorizon)})`}
                      </Text>

                      {factors !== "eth" && (
                        <Flex>
                          <Text
                            variant="neutral"
                            css={{
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            Rewards (
                            {numbro(
                              row.values.earnings.roi.delegatorPercent.rewards
                            ).format({ mantissa: 1, output: "percent" })}
                            ):
                          </Text>
                          <Text
                            css={{
                              marginLeft: "auto",
                              display: "block",
                              fontWeight: 600,
                              color: "$white",
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            {numbro(
                              row.values.earnings.roi.delegator.rewards
                            ).format({ mantissa: 1 })}
                            {" LPT"}
                          </Text>
                        </Flex>
                      )}
                      {factors !== "lpt" && (
                        <Flex>
                          <Text
                            variant="neutral"
                            css={{
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            Fees (
                            {numbro(
                              row.values.earnings.roi.delegatorPercent.fees
                            ).format({ mantissa: 1, output: "percent" })}
                            ):
                          </Text>
                          <Text
                            css={{
                              marginLeft: "auto",
                              display: "block",
                              fontWeight: 600,
                              color: "$white",
                              marginBottom: "$1",
                            }}
                            size="2"
                          >
                            {numbro(
                              row.values.earnings.roi.delegator.fees
                            ).format({ mantissa: 3 })}
                            {" ETH"}
                          </Text>
                        </Flex>
                      )}
                      <A
                        as={Link}
                        passHref
                        href="https://docs.livepeer.org/delegators/reference/yield-calculation"
                      >
                        <Flex
                          css={{
                            marginTop: "$2",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            css={{ whiteSpace: "nowrap" }}
                            variant="neutral"
                            size="1"
                          >
                            Learn how this calculation is performed
                          </Text>
                          <Box
                            css={{ marginLeft: "$1", width: 15, height: 15 }}
                            as={ArrowTopRightIcon}
                          />
                        </Flex>
                      </A>
                    </Box>

                    <Box
                      css={{
                        marginTop: "$3",
                        paddingTop: "$3",
                        borderTop: "1px solid $neutral6",
                      }}
                    >
                      <Text
                        size="1"
                        css={{
                          marginBottom: "$2",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        Orchestrator Data
                      </Text>

                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Reward cut
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {rewardCut}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Fee cut
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {feeCut}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {"Reward call ratio (90d)"}
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {rewardCalls}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {"Trailing 90d fees"}
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(
                            row.values.earnings.ninetyDayVolumeETH
                          ).format({ mantissa: 3, average: true })}
                          {" ETH"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {"Delegated stake"}
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(row.values.earnings.totalStake).format({
                            mantissa: 1,
                            average: true,
                          })}
                          {" LPT"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Latest fee/reward change
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {row?.original?.daysSinceChangeParams} days ago
                        </Text>
                      </Flex>
                    </Box>

                    <Box
                      css={{
                        marginTop: "$3",
                        paddingTop: "$3",
                        borderTop: "1px solid $neutral6",
                      }}
                    >
                      <Text
                        size="1"
                        css={{
                          marginBottom: "$2",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        Assumptions
                      </Text>

                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Block time
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(AVERAGE_L1_BLOCK_TIME).format({
                            mantissa: 0,
                          })}
                          {" seconds"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Time horizon
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(
                            row.values.earnings.roi.params.roundsCount
                          ).format({ mantissa: 0 })}
                          {" rounds"}
                        </Text>
                      </Flex>
                      <Flex>
                        <Text
                          variant="neutral"
                          css={{
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          Total stake
                        </Text>
                        <Text
                          css={{
                            marginLeft: "auto",
                            display: "block",
                            fontWeight: 600,
                            color: "$white",
                            marginBottom: "$1",
                          }}
                          size="2"
                        >
                          {numbro(row.values.earnings.totalActiveStake).format({
                            mantissa: 1,
                            average: true,
                          })}
                          {" LPT"}
                        </Text>
                      </Flex>
                    </Box>
                  </Box>
                </PopoverContent>
              )}
            </Popover>
          );
        },
        sortType: (rowA, rowB) => {
          return rowA.values.earnings.isNewlyActive
            ? -1
            : rowB.values.earnings.isNewlyActive
            ? 1
            : rowA.values.earnings.roi.delegatorPercent.fees +
                rowA.values.earnings.roi.delegatorPercent.rewards >
              rowB.values.earnings.roi.delegatorPercent.fees +
                rowB.values.earnings.roi.delegatorPercent.rewards
            ? 1
            : -1;
        },
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The total amount of stake currently delegated to this
                orchestrator.
              </Box>
            }
          >
            <Box>Delegated Stake</Box>
          </ExplorerTooltip>
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
              {numbro(row.values.totalStake).format({
                mantissa: 0,
                thousandSeparated: true,
              })}{" "}
              LPT
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The total fees this orchestrator has earned in the past 90
                calendar days.
              </Box>
            }
          >
            <Box>Trailing 90D Fees</Box>
          </ExplorerTooltip>
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
              {numbro(row.values.ninetyDayVolumeETH).format({
                mantissa: 2,
                average: true,
              })}{" "}
              ETH
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: <></>,
        id: "actions",
        Cell: ({ row }) => (
          <Flex css={{ alignItems: "center" }}>
            <OrchestratorActionsMenu accountId={row.values.id} />
          </Flex>
        ),
      },
    ],
    [formattedPrinciple, timeHorizon, factors]
  );

  // Mobile detection
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // Yield assumptions controls
  const yieldAssumptionsControls = (
    <YieldAssumptionsControls
      principle={principle}
      setPrinciple={setPrinciple}
      timeHorizon={timeHorizon}
      setTimeHorizon={setTimeHorizon}
      factors={factors}
      setFactors={setFactors}
      inflationChange={inflationChange}
      setInflationChange={setInflationChange}
      protocolData={protocolData}
      maxSupplyTokens={maxSupplyTokens}
      formatPercentChange={formatPercentChange}
    />
  );

  // Render card function for mobile view
  const renderCard = (row: Row<object>, index: number, pageIndex: number) => {
    const rowData = row.original as NonNullable<typeof mappedData>[number];
    return (
      <OrchestratorCard
        key={rowData.id}
        rowData={rowData}
        index={index}
        pageIndex={pageIndex}
        pageSize={pageSize}
        timeHorizon={timeHorizon}
        factors={factors}
      />
    );
  };

  return (
    <Table
      data={mappedData as object[]}
      columns={columns}
      initialState={{
        pageSize,
        hiddenColumns: ["identity"],
        sortBy: [
          {
            id: "earnings",
            desc: true,
          },
        ],
      }}
      input={yieldAssumptionsControls}
      renderCard={isMobile ? renderCard : undefined}
    />
  );
};

export default OrchestratorList;
