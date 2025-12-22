import ErrorComponent from "@components/Error";
import OrchestratorList from "@components/OrchestratorList";
import OrchestratorVotingList from "@components/OrchestratorVotingList";
import { VoterSummary } from "@components/OrchestratorVotingList";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { getLayout } from "@layouts/main";
import { getOrchestrators, getProtocol } from "@lib/api/ssr";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { OrchestratorTabs } from "@lib/orchestrator";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { ArrowRightIcon } from "@modulz/radix-icons";
import { Tab, TabList, TabPanel, TabPanels, Tabs } from "@reach/tabs";
import { CUBE_TYPE, getCubeData } from "cube/cube-client";
import { getOrchestratorsVotingHistory } from "cube/query-generator";
import Head from "next/head";
import Link from "next/link";

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
  initialVoterData?: VoterSummary[];
};

const OrchestratorsPage = ({
  hadError,
  orchestrators,
  protocol,
  initialVoterData,
}: PageProps) => {
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
            css={{ marginBottom: "$3", justifyContent: "space-between" }}
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
                    marginRight: "$2",
                  }}
                >
                  Performance Leaderboard
                  <Box as={ArrowRightIcon} css={{ marginLeft: "$1" }} />
                </Button>
              </A>
            )}
          </Flex>
          <Tabs defaultValue={OrchestratorTabs["Yield Overview"]}>
            {({ selectedIndex, focusedIndex }) => {
              const getTabStyle = (index) => ({
                borderBottom: `4px solid ${
                  selectedIndex === index
                    ? "#6ec08d"
                    : focusedIndex === index
                    ? "#141716"
                    : "#141716"
                }`,
                backgroundColor: "#141716",
                borderWidth: 0,
                borderBottomWidth: 1,
                paddingBottom: 12,
              });
              return (
                <>
                  <TabList>
                    <Tab style={getTabStyle(0)}>Yield Overview</Tab>
                    <Tab style={getTabStyle(1)}>Voting History</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Box>
                        <OrchestratorList
                          data={orchestrators?.transcoders}
                          pageSize={20}
                          protocolData={protocol?.protocol}
                        />
                      </Box>
                    </TabPanel>
                    <TabPanel>
                      <Box>
                        <OrchestratorVotingList
                          initialVoterData={initialVoterData}
                          pageSize={20}
                        />
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </>
              );
            }}
          </Tabs>
        </Flex>
      </Container>
    </>
  );
};

type VoteProposal = {
  "LivepeerVoteProposals.date": string;
  "LivepeerVoteProposals.voter": string;
  "LivepeerVoteProposals.eventTxnsHash": string;
  "LivepeerVoteProposals.voteType": string;
  "LivepeerVoteProposals.count": string;
  "LivepeerVoteProposals.numOfProposals": string;
  "LivepeerVoteProposals.numOfVoteCasted": string;
};

// Function to get unique voter IDs
const getUniqueVoters = (data: VoteProposal[]): string[] => {
  const voterSet = new Set(
    data.map((proposal) => proposal["LivepeerVoteProposals.voter"])
  );
  return Array.from(voterSet);
};

// Function to group data by voter
const groupByVoter = (
  data: VoteProposal[],
  voterId: string
): VoteProposal[] => {
  return data.filter(
    (proposal) => proposal["LivepeerVoteProposals.voter"] === voterId
  );
};

// Function to process vote proposals and generate voter summary
const processVoteProposals = (proposals: VoteProposal[]): VoterSummary => {
  const sortedVotes = proposals.sort(
    (a, b) =>
      new Date(b["LivepeerVoteProposals.date"]).getTime() -
      new Date(a["LivepeerVoteProposals.date"]).getTime()
  );

  const mostRecentVotes = sortedVotes
    .slice(0, 5)
    .map((vote) => vote["LivepeerVoteProposals.voteType"] || null);

  const noOfProposalsVotedOn = Number(
    proposals[0]["LivepeerVoteProposals.numOfProposals"] || 0
  );
  const noOfVotesCasted = Number(
    proposals[0]["LivepeerVoteProposals.numOfVoteCasted"] || 0
  );
  const votingTurnout = noOfProposalsVotedOn
    ? noOfVotesCasted / noOfProposalsVotedOn
    : 0;

  return {
    id: proposals[0]["LivepeerVoteProposals.voter"],
    noOfProposalsVotedOn,
    noOfVotesCasted,
    mostRecentVotes,
    votingTurnout,
  };
};

// Function to get voter summaries for all unique voters
const getVoterSummaries = (data: VoteProposal[]): VoterSummary[] => {
  const uniqueVoters = getUniqueVoters(data);
  return uniqueVoters.map((voterId) => {
    const groupedProposals = groupByVoter(data, voterId);
    return processVoteProposals(groupedProposals);
  });
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

    const query = getOrchestratorsVotingHistory();
    // @ts-expect-error - query is a string
    const response = await getCubeData(query, { type: CUBE_TYPE.SERVER });

    // Log the response to check the structure of the data

    if (!response || !response[0] || !response[0].data) {
      return {
        props: {
          initialVoterData: [],
        },
      };
    }

    const data = response[0].data;

    const voterSummaries = getVoterSummaries(data);

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
      initialVoterData: voterSummaries,
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
