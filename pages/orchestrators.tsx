import ErrorComponent from "@components/Error";
import OrchestratorList from "@components/OrchestratorList";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { getLayout } from "@layouts/main";
import { getOrchestrators, getProtocol } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
} from "../apollo";

type PageProps = {
  hadError: boolean;
  orchestrators: OrchestratorsQueryResult["data"] | null;
  protocol: ProtocolQueryResult["data"] | null;
  fallback: { [key: string]: EnsIdentity };
};

const OrchestratorsPage = ({
  hadError,
  orchestrators,
  protocol,
}: PageProps) => {
  const [showOrchList, setShowOrchList] = useState(false);

  useEffect(() => {
    // Let the browser paint the new route first
    const id = requestAnimationFrame(() => setShowOrchList(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

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
            css={{
              marginBottom: "$3",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "$3",
              "@bp1": {
                justifyContent: "space-between",
              },
            }}
          >
            <Heading size="2" as="h1" css={{ fontWeight: 700 }}>
              Orchestrators
            </Heading>
            {(process.env.NEXT_PUBLIC_NETWORK == "MAINNET" ||
              process.env.NEXT_PUBLIC_NETWORK == "ARBITRUM_ONE") && (
              <A as={Link} href="/leaderboard" passHref>
                <Button
                  ghost
                  css={{
                    color: "$hiContrast",
                    fontSize: "$2",
                  }}
                >
                  Performance Leaderboard
                  <Box as={ArrowRightIcon} css={{ marginLeft: "$1" }} />
                </Button>
              </A>
            )}
          </Flex>
          <Box css={{ marginBottom: "$5" }}>
            {showOrchList ? (
              <OrchestratorList
                data={orchestrators?.transcoders}
                pageSize={20}
                protocolData={protocol?.protocol}
              />
            ) : (
              <Box css={{ padding: "$4", textAlign: "center", opacity: 0.6 }}>
                Loading orchestrators…
              </Box>
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  const errorProps: PageProps = {
    hadError: true,
    orchestrators: null,
    protocol: null,
    fallback: {},
  };

  try {
    const client = getApollo();
    const { orchestrators, fallback } = await getOrchestrators(client);
    const protocol = await getProtocol(client);

    if (!orchestrators.data || !protocol.data) {
      return {
        props: errorProps,
        revalidate: 60,
      };
    }

    const props: PageProps = {
      hadError: false,
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
    return {
      props: errorProps,
      revalidate: 60,
    };
  }
};

OrchestratorsPage.getLayout = getLayout;

export default OrchestratorsPage;
