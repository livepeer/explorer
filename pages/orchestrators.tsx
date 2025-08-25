import OrchestratorList from "@components/OrchestratorList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { getOrchestrators, getProtocol } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
} from "@livepeer/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Head from "next/head";
import Link from "next/link";
import {
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
} from "../apollo";
import { ADiv } from "@components/ADiv"

type PageProps = {
  orchestrators: OrchestratorsQueryResult["data"];
  protocol: ProtocolQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
};

const OrchestratorsPage = ({ orchestrators, protocol }: PageProps) => {
  return (
    <>
      <Head>
        <title>Livepeer Explorer - Orchestrators</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            marginTop: "$5",
            width: "100%",
          }}
        >
          <Flex
            align="center"
            css={{ marginBottom: "$3", justifyContent: "space-between" }}
          >
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
              Orchestrators
            </Heading>
            {(process.env.NEXT_PUBLIC_NETWORK == "MAINNET" ||
              process.env.NEXT_PUBLIC_NETWORK == "ARBITRUM_ONE") && (
              <Link href="/leaderboard" passHref>
                <Button
                  ghost
                  // TODO: Remove this after fix design-system Link incompatibility.
                  as={ADiv}
                  css={{
                    color: "$hiContrast",
                    fontSize: "$2",
                    marginRight: "$2",
                  }}
                >
                  Performance Leaderboard
                  <Box as={ArrowRightIcon} css={{ marginLeft: "$1" }} />
                </Button>
              </Link>
            )}
          </Flex>
          <Box css={{ marginBottom: "$5" }}>
            <OrchestratorList
              data={orchestrators?.transcoders}
              pageSize={20}
              protocolData={protocol?.protocol}
            />
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  try {
    const client = getApollo();
    const { orchestrators, fallback } = await getOrchestrators(client);
    const protocol = await getProtocol(client);

    if (!orchestrators.data || !protocol.data) {
      return null;
    }

    const props: PageProps = {
      orchestrators: orchestrators.data,
      protocol: protocol.data,
      fallback,
    };

    return {
      props,
      revalidate: 1200,
    };
  } catch (e) {
    console.error(e);
  }

  return null;
};

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
