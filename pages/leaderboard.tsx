import PerformanceList from "@components/PerformanceList";
import PerformanceListSelector from '@components/PerformanceListSelector';
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { getOrchestrators } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import { ChevronDownIcon } from "@modulz/radix-icons";
import Head from "next/head";
import { useState } from "react";
import { getApollo, OrchestratorsQueryResult } from "../apollo";
import { Pipeline } from "@lib/api/types/get-available-pipelines";
import { useRegionsData } from "hooks/useSwr";
import { Region } from "@lib/api/types/get-regions";

type PageProps = {
  orchestratorIds: Pick<
    NonNullable<OrchestratorsQueryResult["data"]>["transcoders"][number],
    "id"
  >[];
  fallback: { [key: string]: EnsIdentity };
};

const LeaderboardPage = ({ orchestratorIds }: PageProps) => {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline["id"] | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const knownRegions = useRegionsData();
  const [region, setRegion] = useState<Region["id"]>("GLOBAL");

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Performance Leaderboard</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, width: "100%" }}>
        <Flex
          css={{
            flexDirection: "column",
            marginTop: "$5",
            width: "100%",
          }}
        >
          <Flex justify="between" 
            css={{ 
              width: "100%",
              flexDirection: "column", // Default to column for mobile
              marginBottom: "0",
              "@bp2": {
                flexDirection: "row", // Change to row for larger screens
                marginBottom: "$4",
              },
            }}
          >
            <Heading
              size="3"
              as="h1"
              css={{
                fontWeight: 700,
                fontSize: 26,
                marginBottom: "$2",
                "@bp3": {
                  marginBottom: "0",
                },
              }}
            >
              Performance Leaderboard
            </Heading>
            <Flex
              css={{
                fontSize: "$2",
                flexDirection: "column", // Default to column for mobile
                "@bp2": {
                  flexDirection: "row", // Change to row for larger screens
                },
              }}
            >
              <Flex
                css={{
                  flexDirection: "row", // Stack title and dropdown vertically on mobile
                  alignItems: "center",
                  marginBottom: "$2", // Add margin-bottom for spacing when stacked
                  marginLeft: "$2", // Add margin-left for spacing between groups
                  "@bp2": {
                    marginBottom: "0", // Remove margin-bottom for larger screens
                    marginRight: "$4", // Add margin-right for spacing between groups
                  },
                }}
              >
                <Flex css={{ marginRight: "$2" }}>Region:</Flex>
                  <Box
                    as="select"
                    onChange={(e) => {
                      setRegion(e.target.value as Region["id"]);
                    }}
                    css={{
                      paddingTop: "$1",
                      paddingBottom: "$1",
                      paddingLeft: "$2",
                      border: "none",
                      backgroundColor: "$panel",
                      appearance: "none",
                    }}
                  >
                    {knownRegions?.regions
                    .filter((r) => r.type === (selectedPipeline?"ai":"transcoding"))
                    .map((region) => {
                      return (<Box as="option" key={region.id} value={region.id}>
                        {region.name}
                      </Box>)
                    })}
                  </Box>
                  <Box
                    as={ChevronDownIcon}
                    css={{
                      pointerEvents: "none",
                      }}
                  />
                </Flex>
              <Flex
                css={{
                  flexDirection: "row", // Align title and dropdown horizontally
                  alignItems: "center",
                  marginBottom: "$2", // Add margin-bottom for spacing when stacked
                  marginLeft: "$2", // Add margin-left for spacing between groups
                  "@bp2": {
                    marginBottom: "0", // Remove margin-bottom for larger screens
                  },
                }}
              >
                <Flex css={{ marginRight: "$2" }}>Type:</Flex>
                <PerformanceListSelector
                  selectedPipeline={selectedPipeline}
                  setSelectedPipeline={setSelectedPipeline}
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                />
              </Flex>
            </Flex>
          </Flex>
          <Box css={{ marginBottom: "$5" }}>
            <PerformanceList
              data={orchestratorIds}
              pageSize={20}
              region={region}
              pipeline={selectedPipeline}
              model={selectedModel}
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
