import OrchestratorList from "@components/OrchestratorList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { getOrchestrators, getProtocol } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import {
  Link as A,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  TabsTrigger,
  Tabs,
  TabsList,
  TabsContent,
  Text,
} from "@livepeer/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import Head from "next/head";
import Link from "next/link";
import {
  getApollo,
  OrchestratorsQueryResult,
  ProtocolQueryResult,
} from "../apollo";
import OrchestratorVotingList from "@components/OrchestratorVotingList";
import { OrchestratorTabs } from "@lib/orchestrartor";

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
          <Tabs
            defaultValue={OrchestratorTabs["Yield Overview"]}
            css={{ mb: "$5" }}
          >
            <TabsList>
              <TabsTrigger
                css={{
                  height: 40,
                }}
                value={OrchestratorTabs["Yield Overview"]}
              >
                <Text size="3">Yield Overview</Text>
              </TabsTrigger>
              <TabsTrigger
                css={{
                  height: 40,
                }}
                value={OrchestratorTabs["Voting History"]}
              >
                <Text size="3">Voting History</Text>
              </TabsTrigger>
            </TabsList>
            <TabsContent value={OrchestratorTabs["Yield Overview"]}>
              <Box>
                <OrchestratorList
                  data={orchestrators?.transcoders}
                  pageSize={20}
                  protocolData={protocol?.protocol}
                />
              </Box>
            </TabsContent>
            <TabsContent value={OrchestratorTabs["Voting History"]}>
              <Box>
                <OrchestratorVotingList
                  data={orchestrators?.transcoders}
                  pageSize={20}
                />
              </Box>
            </TabsContent>
          </Tabs>
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
