import ErrorComponent from "@components/Error";
import PerformanceList from "@components/PerformanceList";
import PerformanceListSelector from "@components/PerformanceListSelector";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { getLayout } from "@layouts/main";
import { getOrchestrators } from "@lib/api/ssr";
import { Pipeline } from "@lib/api/types/get-available-pipelines";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { Region } from "@lib/api/types/get-regions";
import { Box, Container, Flex, Heading } from "@livepeer/design-system";
import { ChevronDownIcon } from "@modulz/radix-icons";
import { useAllScoreData, useRegionsData } from "hooks/useSwr";
import Head from "next/head";
import { useMemo, useState } from "react";

import { getApollo, OrchestratorsQueryResult } from "../apollo";

type PageProps = {
  hadError: boolean;
  orchestratorIds: Pick<
    NonNullable<OrchestratorsQueryResult["data"]>["transcoders"][number],
    "id"
  >[];
  fallback: { [key: string]: EnsIdentity };
};

const LeaderboardPage = ({ hadError, orchestratorIds }: PageProps) => {
  const [selectedPipeline, setSelectedPipeline] = useState<
    Pipeline["id"] | null
  >(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const knownRegions = useRegionsData();
  const [region, setRegion] = useState<Region["id"]>("GLOBAL");
  const { data: allScores, isValidating } = useAllScoreData(
    selectedPipeline,
    selectedModel
  );

  // TODO: use new data when endpoint has been updated
  // https://github.com/livepeer/explorer/pull/359#issuecomment-3690188260
  // Filter regions to only show those with data.
  const availableRegions = useMemo(() => {
    if (!knownRegions?.regions) return [];

    const pipelineType = selectedPipeline ? "ai" : "transcoding";

    // If no scores loaded yet, just filter by pipeline type.
    if (!allScores) {
      return knownRegions.regions.filter((r) => r.type === pipelineType);
    }

    // Collect regions that have score data.
    const regionsWithData = new Set<string>();
    Object.values(allScores).forEach((orchestratorData) => {
      if (orchestratorData?.scores) {
        Object.entries(orchestratorData.scores).forEach(
          ([regionKey, value]) => {
            if (value != null) {
              regionsWithData.add(regionKey);
            }
          }
        );
      }
    });

    // Filter regions based on pipeline type and data availability.
    return knownRegions.regions.filter(
      (r) => r.type === pipelineType && regionsWithData.has(r.id)
    );
  }, [knownRegions, allScores, selectedPipeline]);

  if (hadError) {
    return <ErrorComponent statusCode={500} />;
  }

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
          <Flex
            justify="between"
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
                <Flex
                  css={{
                    marginRight: "$2",
                    fontSize: "$2",
                    color: "$hiContrast",
                  }}
                >
                  Region:
                </Flex>
                <Box
                  css={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <Box
                    as="select"
                    onChange={(e) => {
                      setRegion(e.target.value as Region["id"]);
                    }}
                    value={region}
                    css={{
                      paddingTop: "$2",
                      paddingBottom: "$2",
                      paddingLeft: "$3",
                      paddingRight: "$6",
                      border: "1px solid $colors$neutral4",
                      borderRadius: "$2",
                      backgroundColor: "$panel",
                      color: "$hiContrast",
                      fontSize: "$2",
                      fontWeight: 500,
                      appearance: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "$neutral6",
                        backgroundColor: "$neutral2",
                      },
                      "&:focus": {
                        outline: "none",
                        borderColor: "$primary9",
                        boxShadow: "0 0 0 1px $colors$primary9",
                      },
                    }}
                  >
                    {availableRegions.map((region) => {
                      return (
                        <Box as="option" key={region.id} value={region.id}>
                          {region.name}
                        </Box>
                      );
                    })}
                  </Box>
                  <Box
                    as={ChevronDownIcon}
                    css={{
                      position: "absolute",
                      right: "$2",
                      pointerEvents: "none",
                      color: "$neutral9",
                      width: "$4",
                      height: "$4",
                    }}
                  />
                </Box>
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
                <Flex
                  css={{
                    marginRight: "$2",
                    fontSize: "$2",
                    color: "$hiContrast",
                  }}
                >
                  Type:
                </Flex>
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
              orchestratorIds={orchestratorIds}
              pageSize={20}
              region={region}
              pipeline={selectedPipeline}
              model={selectedModel}
              performanceMetrics={allScores}
              isLoadingMetrics={isValidating}
            />
          </Box>
        </Flex>
      </Container>
    </>
  );
};

export const getStaticProps = async () => {
  const errorProps: PageProps = {
    hadError: true,
    orchestratorIds: [],
    fallback: {},
  };

  try {
    const client = getApollo();
    const { orchestrators, fallback } = await getOrchestrators(client);

    if (!orchestrators.data) {
      return {
        props: errorProps,
        revalidate: 60,
      };
    }

    const props: PageProps = {
      hadError: false,
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
    return {
      props: errorProps,
      revalidate: 60,
    };
  }
};

LeaderboardPage.getLayout = getLayout;

export default LeaderboardPage;
