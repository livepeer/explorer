import PerformanceList from "@components/PerformanceList";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { getOrchestrators } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import { ChevronDownIcon } from "@modulz/radix-icons";
import Head from "next/head";
import { useState } from "react";
import { ALL_REGIONS } from "utils/allRegions";
import { getApollo, OrchestratorsQueryResult } from "../apollo";

type PageProps = {
  orchestratorIds: Pick<
    NonNullable<OrchestratorsQueryResult["data"]>["transcoders"][number],
    "id"
  >[];
  fallback: { [key: string]: EnsIdentity };
};

const LeaderboardPage = ({ orchestratorIds }: PageProps) => {
  const [region, setRegion] = useState<keyof typeof ALL_REGIONS>("global");

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Performance Leaderboard</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
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
                    setRegion(e.target.value as keyof typeof ALL_REGIONS);
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
                  {Object.entries(ALL_REGIONS).map(([key, value]) => (
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
              data={orchestratorIds}
              pageSize={20}
              region={region}
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

    if (!orchestrators.data) {
      return null;
    }

    const props: PageProps = {
      // initialApolloState: client.cache.extract(),
      orchestratorIds: orchestrators.data.transcoders.map((t) => ({
        id: t.id,
      })),
      fallback,
    };

    return {
      props,
      revalidate: 3600,
    };
  } catch (e) {
    console.error(e);
  }

  return null;
};

LeaderboardPage.getLayout = getLayout;

export default LeaderboardPage;
