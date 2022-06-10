import { gql, useQuery } from "@apollo/client";
import ExplorerChart from "@components/ExplorerChart";
import OrchestratorList from "@components/OrchestratorList";
import RoundStatus from "@components/RoundStatus";
import Spinner from "@components/Spinner";
import TransactionsList from "@components/TransactionsList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Link from "next/link";
import { eventsQuery } from "queries/eventsQuery";
import { useMemo, useState } from "react";
import { getChartData, getEvents, getOrchestrators } from "../api";
import { getApollo } from "../apollo";
import { chartDataQuery } from "../queries/chartDataQuery";
import { orchestratorsQuery } from "../queries/orchestratorsQuery";

const Panel = ({ children }) => (
  <Flex
    css={{
      minHeight: 220,
      height: 220,
      p: "24px",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      border: "0.5px solid $colors$neutral4",
      flex: 1,
      minWidth: 300,
    }}
  >
    {children}
  </Flex>
);

const Charts = ({ chartData }) => {
  const [feesPaidGrouping, setFeesPaidGrouping] = useState<"day" | "week">(
    "week"
  );
  const feesPaidData = useMemo(
    () =>
      (feesPaidGrouping === "day"
        ? chartData?.chartData?.dayData?.map((day) => ({
            x: Number(day.date),
            y: Number(day.volumeUSD),
          }))
        : chartData?.chartData?.weeklyData?.map((week) => ({
            x: Number(week.date),
            y: Number(week.weeklyVolumeUSD),
          }))) ?? [],
    [feesPaidGrouping, chartData]
  );

  const [usageGrouping, setUsageGrouping] = useState<"day" | "week">("week");
  const usageData = useMemo(
    () =>
      (usageGrouping === "day"
        ? chartData?.chartData?.dayData?.map((day) => ({
            x: Number(day.date),
            y: Number(day.minutes),
          }))
        : chartData?.chartData?.weeklyData?.map((week) => ({
            x: Number(week.date),
            y: Number(week.weeklyUsageMinutes),
          }))) ?? [],
    [usageGrouping, chartData]
  );

  const participationRateData = useMemo(
    () =>
      chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.date),
        y: Number(day.participationRate),
      })) ?? [],
    [chartData]
  );
  const inflationRateData = useMemo(
    () =>
      chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.date),
        y: Number(day?.inflation ?? 0) / 1000000000,
      })) ?? [],
    [chartData]
  );
  const delegatorsCountData = useMemo(
    () =>
      chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.date),
        y: Number(day.delegatorsCount),
      })) ?? [],
    [chartData]
  );
  const activeTranscoderCountData = useMemo(
    () =>
      chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.date),
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
          data={feesPaidData}
          base={Number(
            (feesPaidGrouping === "day"
              ? chartData?.chartData?.oneDayVolumeUSD
              : chartData?.chartData?.oneWeekVolumeUSD) ?? 0
          )}
          basePercentChange={Number(
            (feesPaidGrouping === "day"
              ? chartData?.chartData?.volumeChangeUSD
              : chartData?.chartData?.weeklyVolumeChangeUSD) ?? 0
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
          base={Number(chartData?.chartData?.participationRate ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.participationRateChange ?? 0
          )}
          title="Participation Rate"
          unit="percent"
          type="line"
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The percent of LPT which is minted each round as rewards for delegators/orchestrators on the network."
          data={inflationRateData}
          base={Number(chartData?.chartData?.inflation ?? 0) / 1000000000}
          basePercentChange={Number(chartData?.chartData?.inflationChange ?? 0)}
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
          data={usageData}
          base={Number(
            (usageGrouping === "day"
              ? chartData?.chartData?.oneDayUsage
              : chartData?.chartData?.oneWeekUsage) ?? 0
          )}
          basePercentChange={Number(
            (usageGrouping === "day"
              ? chartData?.chartData?.dailyUsageChange
              : chartData?.chartData?.weeklyUsageChange) ??
              0
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
          base={Number(chartData?.chartData?.delegatorsCount ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.delegatorsCountChange ?? 0
          )}
          title="Delegators"
          unit="none"
          type="line"
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The number of orchestrators providing transcoding services to the network."
          data={activeTranscoderCountData}
          base={Number(chartData?.chartData?.activeTranscoderCount ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.activeTranscoderCountChange ?? 0
          )}
          title="Orchestrators"
          unit="none"
          type="line"
        />
      </Panel>
    </>
  );
};

const Home = () => {
  const { data: protocolData } = useQuery(gql`
    {
      protocol(id: "0") {
        id
        currentRound {
          id
        }
      }
    }
  `);

  const { data: eventsData, loading: eventsDataLoading } = useQuery(
    eventsQuery,
    { variables: { first: 100 }, pollInterval: 30000 }
  );
  const allEvents = useMemo(
    () =>
      eventsData?.transactions
        ?.flatMap((transaction) => transaction.events)
        ?.slice(0, 100) ?? [],
    [eventsData]
  );
  const allIdentities = useMemo(
    () => eventsData?.transcoders.map((t) => t.identity) ?? [],
    [eventsData]
  );

  const query = useMemo(
    () => orchestratorsQuery(protocolData.protocol.currentRound.id),
    [protocolData]
  );
  const { data, loading } = useQuery(query);

  const { data: chartData } = useQuery(chartDataQuery);

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
                minWidth: "100%",
              }}
            >
              <Flex>
                <Box
                  css={{
                    width: "100%",
                    flex: 4,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                  }}
                >
                  <Charts chartData={chartData} />
                </Box>
                <Flex
                  css={{
                    mx: "auto",
                    width: "100%",
                    minWidth: 300,
                    height: "100%",
                    p: "24px",
                    flex: 1,
                  }}
                >
                  <RoundStatus />
                </Flex>
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
                  <Link href="/leaderboard" passHref>
                    <Button
                      ghost
                      as={A}
                      css={{ color: "$hiContrast", fontSize: "$2", mr: "$2" }}
                    >
                      Performance Leaderboard
                    </Button>
                  </Link>
                )}
                <Link href="/orchestrators" passHref>
                  <Button
                    ghost
                    as={A}
                    css={{ color: "$hiContrast", fontSize: "$2" }}
                  >
                    View All
                    <Box as={ArrowRightIcon} css={{ ml: "$1" }} />
                  </Button>
                </Link>
              </Flex>
            </Flex>

            {loading ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <Box>
                <OrchestratorList
                  data={data?.transcoders}
                  pageSize={10}
                  protocolData={data?.protocol}
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
                <Link href="/transactions" passHref>
                  <Button
                    ghost
                    as={A}
                    css={{ color: "$hiContrast", fontSize: "$2" }}
                  >
                    View All
                    <Box as={ArrowRightIcon} css={{ ml: "$1" }} />
                  </Button>
                </Link>
              </Flex>
            </Flex>

            {eventsDataLoading ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <Box>
                <TransactionsList
                  identities={allIdentities}
                  events={allEvents}
                  pageSize={10}
                />
              </Box>
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export async function getStaticProps() {
  const client = getApollo();
  await getOrchestrators(client);
  await getChartData(client);
  await getEvents(client);

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 60,
  };
}

Home.getLayout = getLayout;

export default Home;
