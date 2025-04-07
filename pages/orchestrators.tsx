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
import { getOrchestratorsVotingHistory } from "cube/queryGenrator";
import { CUBE_TYPE, getCubeData } from "cube/cube-client";
import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from "@reach/tabs";

type PageProps = {
  orchestrators: OrchestratorsQueryResult["data"];
  protocol: ProtocolQueryResult["data"];
  fallback: { [key: string]: EnsIdentity };
  initialVoterData: any
};

const OrchestratorsPage = ({ orchestrators, protocol, initialVoterData }: PageProps) => {
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
          >
            {({ selectedIndex, focusedIndex }) => {
              let getTabStyle = (index) => ({
                borderBottom: `4px solid ${selectedIndex === index
                    ? "#6ec08d"
                    : focusedIndex === index
                      ? "#141716"
                      : "#141716"
                  }`
                  ,
                  backgroundColor: '#141716', borderWidth: 0, borderBottomWidth: 1 ,
                  paddingBottom:12
              });
              return (
                <>
                  <TabList>
                    <Tab style={getTabStyle(0)}>
                      Yield Overview
                    </Tab>
                    <Tab style={getTabStyle(1)}>
                      Voting History
                    </Tab>
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
                        <OrchestratorVotingList initialVoterData={initialVoterData} pageSize={20} />
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

type VoterSummary = {
  id: string;
  noOfProposalsVotedOn: number;
  noOfVotesCasted: number;
  mostRecentVotes: (string | null)[];
  votingTurnout: number;
};


// Function to get unique voter IDs
const getUniqueVoters = (data: VoteProposal[]): string[] => {
  const voterSet = new Set(data.map(proposal => proposal["LivepeerVoteProposals.voter"]));
  return Array.from(voterSet);
};

// Function to group data by voter
const groupByVoter = (data: VoteProposal[], voterId: string): VoteProposal[] => {
  return data.filter(proposal => proposal["LivepeerVoteProposals.voter"] === voterId);
};

// Function to process vote proposals and generate voter summary
const processVoteProposals = (proposals: VoteProposal[]): VoterSummary => {
  const sortedVotes = proposals.sort((a, b) =>
    new Date(b["LivepeerVoteProposals.date"]).getTime() - new Date(a["LivepeerVoteProposals.date"]).getTime()
  );

  const mostRecentVotes = sortedVotes.slice(0, 5).map(vote => vote["LivepeerVoteProposals.voteType"] || null);

  const noOfProposalsVotedOn = proposals.length;
  const noOfVotesCasted = proposals.reduce((acc, vote) => acc + parseInt(vote["LivepeerVoteProposals.numOfVoteCasted"], 10), 0);

  const votingTurnout = noOfProposalsVotedOn ? noOfVotesCasted / noOfProposalsVotedOn : 0;

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
  return uniqueVoters.map(voterId => {
    const groupedProposals = groupByVoter(data, voterId);
    return processVoteProposals(groupedProposals);
  });
};



export const getStaticProps = async () => {
  try {

    const query = getOrchestratorsVotingHistory();
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
      initialVoterData: voterSummaries
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
