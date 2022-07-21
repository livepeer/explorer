import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
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
import { gql, useQuery } from "@apollo/client";
import { getApollo, useOrchestratorsQuery, useProtocolQuery } from "../apollo";
import { getOrchestrators } from "api";
import Link from "next/link";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Spinner from "@components/Spinner";

const OrchestratorsPage = () => {
  const { data, loading } = useOrchestratorsQuery();
  const { data: protocolData } = useProtocolQuery();
  return (
    <>
      <Head>
        <title>Livepeer Explorer - Orchestrators</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            mt: "$5",
            width: "100%",
          }}
        >
          <Flex
            align="center"
            css={{ mb: "$3", justifyContent: "space-between" }}
          >
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
              Orchestrators
            </Heading>
            {(process.env.NEXT_PUBLIC_NETWORK == "MAINNET" ||
              process.env.NEXT_PUBLIC_NETWORK == "ARBITRUM_ONE") && (
              <Link href="/leaderboard" passHref>
                <Button
                  ghost
                  as={A}
                  css={{ color: "$hiContrast", fontSize: "$2", mr: "$2" }}
                >
                  Performance Leaderboard
                  <Box as={ArrowRightIcon} css={{ ml: "$1" }} />
                </Button>
              </Link>
            )}
          </Flex>
          <Box css={{ mb: "$5" }}>
            {!protocolData.protocol || !data.transcoders ? (
              <Flex align="center" justify="center">
                <Spinner />
              </Flex>
            ) : (
              <OrchestratorList
                data={data?.transcoders}
                pageSize={20}
                protocolData={protocolData?.protocol}
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

  return {
    props: {
      initialApolloState: client.cache.extract(),
    },
    revalidate: 60,
  };
}

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
