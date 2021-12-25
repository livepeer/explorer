import { getLayout } from "@layouts/main";
import Head from "next/head";
// import { getOrchestrators } from "@lib/utils";
import { Flex, Container, Heading, Box } from "@livepeer/design-system";
import PerformanceList from "@components/PerformanceList";
// import { getApollo } from "core/apollo";
import { getApollo } from "core/apollo";
import { getOrchestrators } from "core/api";
import { orchestratorsQuery } from "core/queries/orchestratorsQuery";
import { gql, useQuery } from "@apollo/client";

const LeaderboardPage = () => {
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
            mt: "$4",
            width: "100%",
          }}
        >
          <Heading
            size="2"
            as="h1"
            css={{
              mb: "$4",
              fontWeight: 600,
              "@bp2": {
                fontSize: 26,
              },
            }}
          >
            Performance Leaderboard
          </Heading>
          <Box css={{ mb: "$5" }}>
            <PerformanceList data={data.transcoders} pageSize={20} />
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
