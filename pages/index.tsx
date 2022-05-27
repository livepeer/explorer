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
      minWidth: 220,
    }}
  >
    {children}
  </Flex>
);

const renderCharts = (chartData) => (
  <>
    <Panel>
      <ExplorerChart
        data={
          chartData?.chartData?.weeklyData?.map((week) => ({
            x: Number(week.date),
            y: Number(week.weeklyVolumeUSD),
          })) ?? []
        }
        base={Number(chartData?.chartData?.oneWeekVolumeUSD ?? 0)}
        basePercentChange={Number(
          chartData?.chartData?.weeklyVolumeChangeUSD ?? 0
        )}
        title="Fees Paid (7d)"
        unit="usd"
        type="bar"
      />
    </Panel>
    <Panel>
      <ExplorerChart
        data={
          chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
            x: Number(day.date),
            y: Number(day.participationRate),
          })) ?? []
        }
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
        data={
          chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
            x: Number(day.date),
            y: Number(day.inflation),
          })) ?? []
        }
        base={Number(chartData?.chartData?.inflation ?? 0)}
        basePercentChange={Number(chartData?.chartData?.inflationChange ?? 0)}
        title="Inflation Rate"
        unit="percent"
        type="line"
      />
    </Panel>
    <Panel>
      <ExplorerChart
        data={
          chartData?.chartData?.weeklyData?.map((week) => ({
            x: Number(week.date),
            y: Number(week.weeklyUsageMinutes),
          })) ?? []
        }
        base={Number(chartData?.chartData?.oneWeekUsage ?? 0)}
        basePercentChange={Number(chartData?.chartData?.weeklyUsageChange ?? 0)}
        title="Estimated Usage (7d)"
        unit="minutes"
        type="bar"
      />
    </Panel>
    <Panel>
      <ExplorerChart
        data={
          chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
            x: Number(day.date),
            y: Number(day.totalDelegators),
          })) ?? []
        }
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
        data={
          chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
            x: Number(day.date),
            y: Number(day.numActiveTranscoders),
          })) ?? []
        }
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
              }}
            >
              <Flex css={{}}>
                <Flex
                  css={{
                    flexWrap: "wrap",
                    flex: 4,
                  }}
                >
                  {renderCharts(chartData)}
                </Flex>
                <Flex
                  css={{
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
                justifyContent: "space-between",
                mb: "$4",
                alignItems: "center",
              }}
            >
              <Flex align="center">
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
                        fontSize: "$2",
                        ml: "$5",
                        "&:hover": {
                          textDecoration: "none",
                        },
                      }}
                    >
                      <Box css={{ display: "inline", mr: "$2" }}>💪</Box>{" "}
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
