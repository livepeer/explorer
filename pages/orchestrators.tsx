import { getLayout } from "@layouts/main";
import Head from "next/head";
import {
  Flex,
  Container,
  Link as A,
  Heading,
  Box,
  Button,
} from "@livepeer/design-system";
import OrchestratorList from "@components/OrchestratorList";
import { orchestratorsQuery } from "../queries/orchestratorsQuery";
import { gql, useQuery } from "@apollo/client";
import { getApollo } from "../apollo";
import { getOrchestrators } from "api";
import Link from "next/link";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Spinner from "@components/Spinner";

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
  const { data, loading } = useQuery(query);
  return (
    <>
      <Head>
        <title>Livepeer Explorer - Orchestrators</title>
      </Head>
      <Container size="3" css={{ width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$5",
            width: "100%",
          }}
        >
          <Flex align="center" css={{ mb: "$3" }}>
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
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
          <Box css={{ mb: "$5" }}>
            {loading ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <OrchestratorList data={data?.transcoders} pageSize={20} />
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

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 60,
  };
}

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
