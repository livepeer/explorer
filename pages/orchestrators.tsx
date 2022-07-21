import OrchestratorList from "@components/OrchestratorList";
import Spinner from "@components/Spinner";
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
import { getOrchestrators, getProtocol } from "api";
import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
  useOrchestratorsQuery,
  useProtocolQuery,
} from "../apollo";

type PageProps = {
  orchestrators: OrchestratorsQueryResult["data"];
  protocol: ProtocolQueryResult["data"];
};

const OrchestratorsPage = ({ orchestrators, protocol }: PageProps) => {
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

export const getStaticProps: GetStaticProps = async () => {
  try {
    const client = getApollo();
    const orchestrators = await getOrchestrators(client);
    const protocol = await getProtocol(client);

    if (!orchestrators.data || !protocol.data) {
      return { notFound: true };
    }

    const props: PageProps = {
      orchestrators: orchestrators.data,

      protocol: protocol.data,
    };

    return {
      props,
      revalidate: 60,
    };
  } catch (e) {
    console.error(e);
  }

  return { notFound: true };
};

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
