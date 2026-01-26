import "react-circular-progressbar/dist/styles.css";

import ErrorComponent from "@components/Error";
import type { Group } from "@components/ExplorerChart";
import ExplorerChart from "@components/ExplorerChart";
import OrchestratorList from "@components/OrchestratorList";
import RoundStatus from "@components/RoundStatus";
import Spinner from "@components/Spinner";
import TransactionsList, {
  FILTERED_EVENT_TYPENAMES,
} from "@components/TransactionsList";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { HomeChartData } from "@lib/api/types/get-chart-data";
import { EnsIdentity } from "@lib/api/types/get-ens";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import { useChartData } from "hooks";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  EventsQueryResult,
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
} from "../apollo";
import { getEvents, getOrchestrators, getProtocol } from "../lib/api/ssr";

const Panel = ({ children }) => (
  <Flex
    css={{
      minHeight: 240,
      height: 240,
      padding: "24px",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "0.5px solid $colors$neutral4",
      flex: 1,
      width: "100%",
      minWidth: 350,
    }}
  >
    {children}
  </Flex>
);

const Charts = ({ chartData }: { chartData: HomeChartData | null }) => {
  const [feesPaidGrouping, setFeesPaidGrouping] = useState<Group>("week");
  const feesPaidData = useMemo(
    () =>
      (feesPaidGrouping === "day"
        ? chartData?.dayData?.map((day) => ({
            x: Number(day.dateS),
            y: Number(day.volumeUsd),
          }))
        : chartData?.weeklyData?.map((week) => ({
            x: Number(week.date),
            y: Number(week.weeklyVolumeUsd),
          }))) ?? [],
    [feesPaidGrouping, chartData]
  );

  const [usageGrouping, setUsageGrouping] = useState<Group>("week");
  const usageData = useMemo(
    () =>
      (usageGrouping === "day"
        ? chartData?.dayData?.map((day) => ({
            x: Number(day.dateS),
            y: Number(day.feeDerivedMinutes),
          }))
        : chartData?.weeklyData?.map((week) => ({
            x: Number(week.date),
            y: Number(week.weeklyUsageMinutes),
          }))) ?? [],
    [usageGrouping, chartData]
  );

  const getDaySeries = useCallback(
    (
      grouping: Group,
      accessor: (day: NonNullable<HomeChartData["dayData"]>[number]) => number
    ) =>
      chartData?.dayData?.slice(grouping === "year" ? -365 : 1).map((day) => ({
        x: Number(day.dateS),
        y: accessor(day),
      })) ?? [],
    [chartData]
  );

  const [participationGrouping, setParticipationGrouping] =
    useState<Group>("year");
  const participationRateData = useMemo(
    () =>
      getDaySeries(participationGrouping, (day) =>
        Number(day.participationRate)
      ),
    [getDaySeries, participationGrouping]
  );

  const [inflationGrouping, setInflationGrouping] = useState<Group>("year");
  const inflationRateData = useMemo(
    () =>
      getDaySeries(
        inflationGrouping,
        (day) => Number(day?.inflation ?? 0) / 1000000000
      ),
    [getDaySeries, inflationGrouping]
  );

  const [delegatorsGrouping, setDelegatorsGrouping] = useState<Group>("year");
  const delegatorsCountData = useMemo(
    () =>
      getDaySeries(delegatorsGrouping, (day) => Number(day.delegatorsCount)),
    [getDaySeries, delegatorsGrouping]
  );

  const [orchestratorsGrouping, setOrchestratorsGrouping] =
    useState<Group>("year");
  const activeTranscoderCountData = useMemo(
    () =>
      getDaySeries(orchestratorsGrouping, (day) =>
        Number(day.activeTranscoderCount)
      ),
    [getDaySeries, orchestratorsGrouping]
  );

  return (
    <>
      <Panel>
        <ExplorerChart
          tooltip={`The amount of ${
            feesPaidGrouping === "day" ? "daily" : "weekly"
          } fees in dollars which have been historically paid out using the protocol.`}
          data={
            feesPaidGrouping === "week"
              ? feesPaidData.slice(-26)
              : feesPaidData.slice(-183)
          }
          base={Number(
            (feesPaidGrouping === "day"
              ? chartData?.oneDayVolumeUSD
              : chartData?.oneWeekVolumeUSD) ?? 0
          )}
          basePercentChange={Number(
            (feesPaidGrouping === "day"
              ? chartData?.volumeChangeUSD
              : chartData?.weeklyVolumeChangeUSD) ?? 0
          )}
          title={`Fees Paid ${feesPaidGrouping === "day" ? "(1d)" : "(7d)"}`}
          unit="usd"
          type="bar"
          grouping={feesPaidGrouping}
          onToggleGrouping={setFeesPaidGrouping}
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The percent of LPT which has been delegated to an orchestrator."
          data={participationRateData}
          base={Number(chartData?.participationRate ?? 0)}
          basePercentChange={Number(chartData?.participationRateChange ?? 0)}
          title="Participation Rate"
          unit="percent"
          type="line"
          grouping={participationGrouping}
          onToggleGrouping={setParticipationGrouping}
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The percent of LPT which is minted each round as rewards for delegators/orchestrators on the network."
          data={inflationRateData}
          base={Number(chartData?.inflation ?? 0) / 1000000000}
          basePercentChange={Number(chartData?.inflationChange ?? 0)}
          title="Inflation Rate"
          unit="small-percent"
          type="line"
          grouping={inflationGrouping}
          onToggleGrouping={setInflationGrouping}
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip={`The ${
            usageGrouping === "day" ? "daily" : "weekly"
          } usage of the network in minutes.`}
          data={
            usageGrouping === "week"
              ? usageData.slice(-26)
              : usageData.slice(-183)
          }
          base={Number(
            (usageGrouping === "day"
              ? chartData?.oneDayUsage
              : chartData?.oneWeekUsage) ?? 0
          )}
          basePercentChange={Number(
            (usageGrouping === "day"
              ? chartData?.dailyUsageChange
              : chartData?.weeklyUsageChange) ?? 0
          )}
          title={`Estimated Usage ${usageGrouping === "day" ? "(1d)" : "(7d)"}`}
          unit="minutes"
          type="bar"
          grouping={usageGrouping}
          onToggleGrouping={setUsageGrouping}
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The count of delegators participating in the network."
          data={delegatorsCountData}
          base={Number(chartData?.delegatorsCount ?? 0)}
          basePercentChange={Number(chartData?.delegatorsCountChange ?? 0)}
          title="Delegators"
          unit="small-unitless"
          type="line"
          grouping={delegatorsGrouping}
          onToggleGrouping={setDelegatorsGrouping}
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The number of orchestrators providing transcoding services to the network."
          data={activeTranscoderCountData}
          base={Number(chartData?.activeTranscoderCount ?? 0)}
          basePercentChange={Number(
            chartData?.activeTranscoderCountChange ?? 0
          )}
          title="Orchestrators"
          unit="none"
          type="line"
          grouping={orchestratorsGrouping}
          onToggleGrouping={setOrchestratorsGrouping}
        />
      </Panel>
    </>
  );
};

type PageProps = {
  hadError: boolean;
  orchestrators: OrchestratorsQueryResult["data"] | null;
  events: EventsQueryResult["data"] | null;
  protocol: ProtocolQueryResult["data"] | null;
  fallback: { [key: string]: EnsIdentity };
};

const Home = ({ hadError, orchestrators, events, protocol }: PageProps) => {
  const [showOrchList, setShowOrchList] = useState(false);

  useEffect(() => {
    // Let the browser paint the new route first
    const id = requestAnimationFrame(() => setShowOrchList(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const allEvents = useMemo(
    () =>
      events?.transactions
        ?.flatMap((transaction) => transaction.events)
        ?.filter((e) =>
          e?.__typename === "BondEvent"
            ? e?.additionalAmount !== "0.000000000000000001"
            : !FILTERED_EVENT_TYPENAMES.includes(e?.__typename ?? "")
        )
        ?.slice(0, 100) ?? [],
    [events]
  );

  const chartData = useChartData();

  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

  return (
    <>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            marginTop: "$3",
            width: "100%",
            "@bp3": {
              marginTop: "$6",
            },
          }}
        >
          <Heading
            as="h1"
            css={{
              color: "$hiContrast",
              fontSize: "$3",
              fontWeight: 600,
              mb: "$5",
              display: "none",
              alignItems: "center",
              "@bp2": {
                fontSize: "$7",
              },
              "@bp3": {
                display: "flex",
                fontSize: "$7",
              },
            }}
          >
            Overview
          </Heading>
          <Flex
            css={{
              marginBottom: "$7",
            }}
          >
            <Flex
              css={{
                backgroundColor: "$panel",
                borderRadius: "$4",
                border: "1px solid $colors$neutral4",
                overflow: "hidden",
                marginLeft: "auto",
                marginRight: "auto",
                overflowX: "auto",
              }}
            >
              <Flex>
                <Box
                  css={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                  }}
                >
                  <Charts chartData={chartData} />
                </Box>
              </Flex>
              <Flex
                css={{
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  padding: "24px",
                  flex: 1,
                }}
              >
                <RoundStatus protocol={protocol?.protocol} />
              </Flex>
            </Flex>
          </Flex>
          <Box css={{ marginBottom: "$3" }}>
            <Flex
              css={{
                flexDirection: "column",
                justifyContent: "space-between",
                marginBottom: "$4",
                alignItems: "center",
                "@bp1": {
                  flexDirection: "row",
                },
              }}
            >
              <Flex
                css={{
                  flexDirection: "column",
                  "@bp1": {
                    flexDirection: "row",
                  },
                }}
                align="center"
              >
                <Heading size="2" css={{ fontWeight: 600 }}>
                  Orchestrators
                </Heading>
              </Flex>
              <Flex align="center">
                {(process.env.NEXT_PUBLIC_NETWORK == "MAINNET" ||
                  process.env.NEXT_PUBLIC_NETWORK == "ARBITRUM_ONE") && (
                  <A as={Link} href="/leaderboard" passHref>
                    <Button
                      ghost
                      css={{
                        color: "$hiContrast",
                        fontSize: "$2",
                        marginRight: "$2",
                      }}
                    >
                      Performance Leaderboard
                    </Button>
                  </A>
                )}
                <A as={Link} href="/orchestrators" passHref>
                  <Button ghost css={{ color: "$hiContrast", fontSize: "$2" }}>
                    View All
                    <Box as={ArrowRightIcon} css={{ marginLeft: "$1" }} />
                  </Button>
                </A>
              </Flex>
            </Flex>

            {!orchestrators?.transcoders || !protocol?.protocol ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <Box>
                {showOrchList ? (
                  <OrchestratorList
                    data={orchestrators?.transcoders}
                    pageSize={10}
                    protocolData={protocol?.protocol}
                  />
                ) : (
                  <Box
                    css={{ padding: "$4", textAlign: "center", opacity: 0.6 }}
                  >
                    Loading orchestrators…
                  </Box>
                )}
              </Box>
            )}

            <Flex
              css={{
                flexDirection: "column",
                justifyContent: "space-between",
                marginBottom: "$4",
                marginTop: "$7",
                alignItems: "center",
                "@bp1": {
                  flexDirection: "row",
                },
              }}
            >
              <Flex
                css={{
                  flexDirection: "column",
                  "@bp1": {
                    flexDirection: "row",
                  },
                }}
                align="center"
              >
                <Heading size="2" css={{ fontWeight: 600 }}>
                  Transactions
                </Heading>
              </Flex>
              <Flex align="center">
                <A as={Link} href="/transactions" passHref>
                  <Button ghost css={{ color: "$hiContrast", fontSize: "$2" }}>
                    View All
                    <Box as={ArrowRightIcon} css={{ marginLeft: "$1" }} />
                  </Button>
                </A>
              </Flex>
            </Flex>

            <Box>
              <TransactionsList
                events={
                  allEvents as NonNullable<
                    EventsQueryResult["data"]
                  >["transactions"][number]["events"]
                }
                pageSize={10}
              />
            </Box>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  const errorProps: PageProps = {
    hadError: true,
    orchestrators: null,
    events: null,
    protocol: null,
    fallback: {},
  };

  try {
    const client = getApollo();
    const { orchestrators } = await getOrchestrators(client);
    const { events } = await getEvents(client);
    const protocol = await getProtocol(client);

    if (!orchestrators.data || !events.data || !protocol.data) {
      return {
        props: errorProps,
        revalidate: 60,
      };
    }

    const props: PageProps = {
      hadError: false,
      orchestrators: orchestrators.data,
      events: events.data,
      protocol: protocol.data,
      fallback: {},
    };

    return {
      props,
      revalidate: 1200,
    };
  } catch (e) {
    console.error(e);
    return {
      props: errorProps,
      revalidate: 60,
    };
  }
};

export default Home;
