import { gql, useQuery } from "@apollo/client";
import ExplorerChart from "@components/ExplorerChart";
import GlobalChart from "@components/GlobalChart";
import OrchestratorList from "@components/OrchestratorList";
import Spinner from "@components/Spinner";
import { getLayout } from "@layouts/main";
import {
  Box, Button, Container, Flex,
  Heading, Link as A
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
      position: "relative",
      bc: "$panel",
      p: "24px",
      marginRight: 16,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      border: "1px solid $colors$neutral4",
      width: "100%",
      "@bp2": {
        width: 330,
      },
    }}
  >
    <Box css={{ borderColor: "$border" }} />
    {children}
  </Flex>
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

  const flickityOptions = {
    wrapAround: true,
    cellAlign: "left",
    prevNextButtons: false,
    draggable: true,
    pageDots: true,
  };

  console.log({ chartData });

  return (
    <>
      <Container size="3" css={{ width: "100%" }}>
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
              // boxShadow: "inset -20px 0px 20px -20px rgb(0 0 0 / 70%)",
              // ".dot": {
              //   backgroundColor: "$neutral6",
              // },
              // ".dot.is-selected": {
              //   backgroundColor: "$primary11",
              // },
              flexWrap: "wrap",
            }}
          >
            {/* <Flickity
              className={"flickity"}
              elementType={"div"}
              options={flickityOptions}
              disableImagesLoaded={true} // default false
              reloadOnUpdate
              static
            > */}
            <Panel>
              <ExplorerChart
                data={
                  chartData?.chartData?.weeklyData?.map((week) => ({
                    x: Number(week.date),
                    y: Number(week.weeklyVolumeUSD),
                  })) ?? []
                }
                base={Number(chartData?.chartData?.oneWeekVolumeUSD ?? 0)}
                basePercentChange={Number(chartData?.chartData?.weeklyVolumeChangeUSD ?? 0)}
                title="Fees Paid (7d)"
                unit="usd"
                type="bar"
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
                type="line"
              />
            </Panel>
            <Panel>
            <ExplorerChart
                data={
                  (chartData?.chartData?.dayData?.slice(1)?.map((day) => ({
                    x: Number(day.date),
                    y: Number(day.participationRate),
                  })) ?? [])
                }
                base={Number(chartData?.chartData?.participationRate ?? 0)}
                basePercentChange={Number(chartData?.chartData?.participationRateChange ?? 0)}
                title="Participation Rate"
                unit="percent"
                type="line"
              />
            </Panel>
            {/* </Flickity> */}
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
