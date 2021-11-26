import { getLayout } from "@layouts/main";
import Link from "next/link";
import GlobalChart from "@components/GlobalChart";
import Flickity from "react-flickity-component";
import {
  Box,
  Flex,
  Heading,
  Container,
  Button,
  Link as A,
} from "@livepeer/design-system";
import { getChartData, getOrchestrators } from "../api";
import OrchestratorList from "@components/OrchestratorList";
import { getApollo } from "../apollo";
import { gql, useQuery } from "@apollo/client";
import { orchestratorsQuery } from "../queries/orchestratorsQuery";
import { chartDataQuery } from "../queries/chartDataQuery";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Spinner from "@components/Spinner";

const Panel = ({ children }) => (
  <Flex
    css={{
      minHeight: 350,
      height: 350,
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
        width: "43%",
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
        currentRound {
          id
        }
      }
    }
  `);
  const query = orchestratorsQuery(protocolData.protocol.currentRound.id);
  const { data, loading } = useQuery(query);

  const { data: chartData } = useQuery(chartDataQuery);

  const flickityOptions = {
    wrapAround: true,
    cellAlign: "left",
    prevNextButtons: false,
    draggable: true,
    pageDots: true,
  };

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
          <Box
            css={{
              mb: "$7",
              boxShadow: "inset -20px 0px 20px -20px rgb(0 0 0 / 70%)",
              ".dot": {
                backgroundColor: "$neutral6",
              },
              ".dot.is-selected": {
                backgroundColor: "$primary11",
              },
            }}
          >
            <Flickity
              className={"flickity"}
              elementType={"div"}
              options={flickityOptions}
              disableImagesLoaded={true} // default false
              reloadOnUpdate
              static
            >
              <Panel>
                <GlobalChart
                  data={chartData}
                  display="volume"
                  title="Estimated Usage (7d)"
                  field="weeklyUsageMinutes"
                  unit="minutes"
                />
              </Panel>
              <Panel>
                <GlobalChart
                  data={chartData}
                  display="volume"
                  title="Fee Volume (7d)"
                  field="weeklyVolumeUSD"
                  unit="usd"
                />
              </Panel>
              <Panel>
                <GlobalChart
                  data={chartData}
                  display="area"
                  title="Participation"
                  field="participationRate"
                />
              </Panel>
            </Flickity>
          </Box>
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
              <OrchestratorList data={data?.transcoders} pageSize={10} />
            )}
          </Box>
          {/* <Box>
            <Flex
              css={{
                justifyContent: "space-between",
                mb: "$2",
                alignItems: "center",
              }}
            >
              <Box as="h2" css={{ fontWeight: 500, fontSize: 18 }}>
                Orchestrator Payouts
              </Box>
            </Flex>
            <OrchestratorPayouts />
          </Box> */}
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
