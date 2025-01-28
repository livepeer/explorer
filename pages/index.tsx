import ExplorerChart from "@components/ExplorerChart";
import OrchestratorList from "@components/OrchestratorList";
import RoundStatus from "@components/RoundStatus";
import Spinner from "@components/Spinner";
import TransactionsList, {
  FILTERED_EVENT_TYPENAMES,
} from "@components/TransactionsList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import {
  Link as LivepeerLink, // Renamed to avoid confusion with next/link
  Box,
  Button,
  Container,
  Flex,
  Heading,
} from "@jjasonn.stone/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import NextLink from "next/link"; // Import next/link as NextLink to differentiate

import { useMemo, useState } from "react";
import {
  EventsQueryResult,
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
} from "../apollo";
import { getEvents, getOrchestrators, getProtocol } from "../lib/api/ssr";

import { HomeChartData } from "@lib/api/types/get-chart-data";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { useChartData } from "hooks";
import "react-circular-progressbar/dist/styles.css";

const Panel = ({ children }) => (
  <Flex
    css={{
      minHeight: 240,
      height: 240,
      p: "24px",
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
  const [feesPaidGrouping, setFeesPaidGrouping] = useState<"day" | "week">(
    "week"
  );
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

  const [usageGrouping, setUsageGrouping] = useState<"day" | "week">("week");
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

  const participationRateData = useMemo(
    () =>
      chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.dateS),
        y: Number(day.participationRate),
      })) ?? [],
    [chartData]
  );
  const inflationRateData = useMemo(
    () =>
      chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.dateS),
        y: Number(day?.inflation ?? 0) / 1000000000,
      })) ?? [],
    [chartData]
  );
  const delegatorsCountData = useMemo(
    () =>
      chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.dateS),
        y: Number(day.delegatorsCount),
      })) ?? [],
    [chartData]
  );
  const activeTranscoderCountData = useMemo(
    () =>
      chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.dateS),
        y: Number(day.activeTranscoderCount),
      })) ?? [],
    [chartData]
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
        />
      </Panel>
    </>
  );
};

type PageProps = {
  orchestrators: OrchestratorsQueryResult["data"];
  events: EventsQueryResult["data"];
  protocol: ProtocolQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const Home = ({ orchestrators, events, protocol }: PageProps) => {
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

  return (
    <>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$3",
            width: "100%",
            "@bp3": {
              mt: "$6",
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
              mb: "$7",
            }}
          >
            <Flex
              css={{
                bc: "$panel",
                borderRadius: "$4",
                border: "1px solid $colors$neutral4",
                overflow: "hidden",
                mx: "auto",
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
                  p: "24px",
                  flex: 1,
                }}
              >
                <RoundStatus protocol={protocol?.protocol} />
              </Flex>
            </Flex>
          </Flex>
          <Box css={{ mb: "$3" }}>
            <Flex
              css={{
                flexDirection: "column",
                justifyContent: "space-between",
                mb: "$4",
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
                  <Button
                    ghost
                    as={LivepeerLink}
                    href="/leaderboard" // Moved href here
                    css={{ color: "$hiContrast", fontSize: "$2", mr: "$2" }}
                  >
                    Performance Leaderboard
                  </Button>
                )}
                <Button
                  ghost
                  as={LivepeerLink}
                  href="/orchestrators" // Moved href here
                  css={{ color: "$hiContrast", fontSize: "$2" }}
                >
                  View All
                  <Box as={ArrowRightIcon} css={{ ml: "$1" }} />
                </Button>
              </Flex>
            </Flex>

            {!orchestrators?.transcoders || !protocol?.protocol ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <Box>
                <OrchestratorList
                  data={orchestrators?.transcoders}
                  pageSize={10}
                  protocolData={protocol?.protocol}
                />
              </Box>
            )}

            <Flex
              css={{
                flexDirection: "column",
                justifyContent: "space-between",
                mb: "$4",
                mt: "$7",
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
                <Button
                  ghost
                  as={LivepeerLink}
                  href="/transactions" // Moved href here
                  css={{ color: "$hiContrast", fontSize: "$2" }}
                >
                  View All
                  <Box as={ArrowRightIcon} css={{ ml: "$1" }} />
                </Button>
              </Flex>
            </Flex>

            <Box>
              <TransactionsList events={allEvents as any} pageSize={10} />
            </Box>
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  const errorProps = {
    props: {},
    revalidate: 300,
  };
  try {
    const client = getApollo();
    const { orchestrators, fallback } = await getOrchestrators(client);
    const { events, fallback: eventsFallback } = await getEvents(client);
    const protocol = await getProtocol(client);

    if (!orchestrators.data || !events.data || !protocol.data) {
      return errorProps;
    }

    const props: PageProps = {
      orchestrators: orchestrators.data,
      events: events.data,
      protocol: protocol.data,
      fallback: {},
      // fallback: { ...fallback, ...eventsFallback },
    };

    return {
      props,
      revalidate: 1200,
    };
  } catch (e) {
    console.error(e);
  }

  return errorProps;
};

Home.getLayout = getLayout;

export default Home;