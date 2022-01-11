import { getLayout } from "@layouts/main";
import Head from "next/head";
import { Flex, Container, Heading, Box } from "@livepeer/design-system";
import PerformanceList from "@components/PerformanceList";
import { getApollo } from "core/apollo";
import { getOrchestrators } from "core/api";
import { orchestratorsQuery } from "core/queries/orchestratorsQuery";
import { gql, useQuery } from "@apollo/client";
import { useState } from "react";
import { ChevronDownIcon } from "@modulz/radix-icons";

const LeaderboardPage = () => {
  const [region, setRegion] = useState("global");
  const regions = {
    global: "Global",
    fra: "Frankfurt",
    lax: "Los Angeles",
    lon: "London",
    mdw: "Chicago",
    nyc: "New York City",
    prg: "Prague",
    sin: "Singapore",
  };

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
  const { data } = useQuery(query);

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Performance Leaderboard</title>
      </Head>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$5",
            width: "100%",
          }}
        >
          <Flex align="center" justify="between" css={{ mb: "$4" }}>
            <Heading
              size="3"
              as="h1"
              css={{
                fontWeight: 700,
                "@bp2": {
                  fontSize: 26,
                },
              }}
            >
              Performance Leaderboard
            </Heading>
            <Flex css={{ fontSize: "$2" }} align="center">
              <Flex css={{ mr: "$2" }}>Region:</Flex>
              <Flex
                align="center"
                css={{
                  bc: "$panel",
                  borderRadius: "$2",
                  border: "1px solid $neutral5",
                  position: "relative",
                }}
              >
                <Box
                  as="select"
                  onChange={(e) => {
                    setRegion(e.target.value);
                  }}
                  css={{
                    py: "$1",
                    pl: "$2",
                    border: "none",
                    bc: "transparent",
                    appearance: "none",
                    pr: "$5",
                  }}
                >
                  {Object.entries(regions).map(([key, value]) => (
                    <Box as="option" key={key} value={key}>
                      {value}
                    </Box>
                  ))}
                </Box>
                <Box
                  as={ChevronDownIcon}
                  css={{
                    pointerEvents: "none",
                    right: 6,
                    position: "absolute",
                  }}
                />
              </Flex>
            </Flex>
          </Flex>
          <Box css={{ mb: "$5" }}>
            <PerformanceList
              data={data.transcoders}
              pageSize={20}
              region={region}
            />
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export async function getStaticProps() {
  const client = getApollo();
  await getOrchestrators(client);

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 1,
  };
}

LeaderboardPage.getLayout = getLayout;

export default LeaderboardPage;
