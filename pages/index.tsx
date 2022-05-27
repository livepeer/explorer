import { gql, useQuery } from "@apollo/client";
import ExplorerChart from "@components/ExplorerChart";
import OrchestratorList from "@components/OrchestratorList";
import RoundStatus from "@components/RoundStatus";
import Spinner from "@components/Spinner";
import { getLayout } from "@layouts/main";
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
import { useMemo } from "react";
import { getChartData, getOrchestrators } from "../api";
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
  const feesPaidData = useMemo(
    () =>
      chartData?.chartData?.dayData?.map((day) => ({
        x: Number(day.date),
        y: Number(day.volumeETH),
      })) ?? [],
    [chartData]
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
  const weeklyUsageData = useMemo(
    () =>
      chartData?.chartData?.dayData?.map((day) => ({
        x: Number(day.date),
        y: Number(day.minutes),
      })) ?? [],
    [chartData]
  );
  const totalDelegatorsData = useMemo(
    () =>
      chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.date),
        y: Number(day.totalDelegators),
      })) ?? [],
    [chartData]
  );
  const numActiveTranscodersData = useMemo(
    () =>
      chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
        x: Number(day.date),
        y: Number(day.numActiveTranscoders),
      })) ?? [],
    [chartData]
  );

  return (
    <>
      <Panel>
        <ExplorerChart
          tooltip="The amount of daily fees in ether which have been historically paid out using the protocol."
          data={feesPaidData}
          base={Number(chartData?.chartData?.oneWeekVolumeUSD ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.weeklyVolumeChangeUSD ?? 0
          )}
          title="Fees Paid"
          unit="eth"
          type="bar"
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
          tooltip="The daily usage of the network in minutes."
          data={weeklyUsageData}
          base={Number(chartData?.chartData?.oneWeekUsage ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.weeklyUsageChange ?? 0
          )}
          title="Estimated Usage"
          unit="minutes"
          type="bar"
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The count of delegators participating in the network."
          data={totalDelegatorsData}
          base={Number(chartData?.chartData?.totalDelegators ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.totalDelegatorsChange ?? 0
          )}
          title="Delegators"
          unit="none"
          type="line"
        />
      </Panel>
      <Panel>
        <ExplorerChart
          tooltip="The number of orchestrators providing transcoding services to the network."
          data={numActiveTranscodersData}
          base={Number(chartData?.chartData?.numActiveTranscoders ?? 0)}
          basePercentChange={Number(
            chartData?.chartData?.numActiveTranscodersChange ?? 0
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

  const query = useMemo(
    () => orchestratorsQuery(protocolData.protocol.currentRound.id),
    [protocolData]
  );
  const { data, loading } = useQuery(query);

  const { data: chartData } = useQuery(chartDataQuery);

  console.log(chartData);

  return (
    <>
      <Container css={{ width: "100%", maxWidth: 1350 }}>
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
                    flex: 4,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                  }}
                >
                  <Charts chartData={chartData} />
                </Box>
                <Flex
                  css={{
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
                {(process.env.NEXT_PUBLIC_NETWORK == "MAINNET" ||
                  process.env.NEXT_PUBLIC_NETWORK == "ARBITRUM_ONE") && (
                  <Link href="/leaderboard" passHref>
                    <Button
                      ghost
                      as={A}
                      css={{
                        mr: "$3",
                        color: "$hiContrast",
                        fontSize: "$1",
                        ml: "$5",
                        "&:hover": {
                          textDecoration: "none",
                        },
                        "@bp1": { mt: 0, fontSize: "$2" },
                        mt: "$1",
                      }}
                    >
                      <Box
                        css={{
                          display: "inline",
                          mr: "$2",
                        }}
                      >
                        💪
                      </Box>{" "}
                      Performance Leaderboard
                      <Box as={ArrowRightIcon} css={{ ml: "$1" }} />
                    </Button>
                  </Link>
                )}
              </Flex>
              <Flex align="center">
                <Link href="/orchestrators" passHref>
                  <Button
                    ghost
                    as={A}
                    css={{ color: "$hiContrast", fontSize: "$2" }}
                  >
                    View All
                  </Button>
                </Link>
              </Flex>
            </Flex>
            {loading ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <OrchestratorList
                data={data?.transcoders}
                pageSize={10}
                protocolData={data?.protocol}
              />
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

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 60,
  };
}

Home.getLayout = getLayout;

export default Home;
