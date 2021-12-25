import { getLayout } from "@layouts/main";
import Head from "next/head";
import { Flex, Container, Heading, Box } from "@livepeer/design-system";
import OrchestratorList from "@components/OrchestratorList";
import { orchestratorsQuery } from "core/queries/orchestratorsQuery";
import { gql, useQuery } from "@apollo/client";
import { getApollo } from "core/apollo";
import { getOrchestrators } from "core/api";

const OrchestratorsPage = () => {
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
        <title>Livepeer Explorer - Orchestrators</title>
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
            Orchestrators
          </Heading>
          <Box css={{ mb: "$5" }}>
            <OrchestratorList data={data.transcoders} pageSize={20} />
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
    revalidate: 60,
  };
}

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
