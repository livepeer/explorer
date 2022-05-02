import { getLayout } from "@layouts/main";
import fm from "front-matter";
import IPFS from "ipfs-mini";
import VotingWidget from "@components/VotingWidget";
import ReactMarkdown from "react-markdown";
import { abbreviateNumber } from "../../lib/utils";
import { useRouter } from "next/router";
import { useQuery, useApolloClient, gql } from "@apollo/client";

import Spinner from "@components/Spinner";
import { useEffect, useState } from "react";
import moment from "moment";
import { useWindowSize } from "react-use";
import BottomDrawer from "@components/BottomDrawer";
import Head from "next/head";
import { useAccountAddress, usePageVisibility } from "../../hooks";
import { pollQuery } from "../../queries/pollQuery";
import { accountQuery } from "../../queries/accountQuery";
import { voteQuery } from "../../queries/voteQuery";
import FourZeroFour from "../404";
import {
  Container,
  Box,
  Flex,
  Card,
  Badge,
  Button,
  Heading,
  Text,
} from "@livepeer/design-system";
import Stat from "@components/Stat";

const Poll = () => {
  const router = useRouter();
  const accountAddress = useAccountAddress();
  const client = useApolloClient();
  const { width } = useWindowSize();
  const isVisible = usePageVisibility();
  const [pollData, setPollData] = useState(null);
  const { query } = router;

  const pollId = query?.poll?.toString().toLowerCase();
  const pollInterval = 20000;

  const {
    data,
    startPolling: startPollingPoll,
    stopPolling: stopPollingPoll,
  } = useQuery(pollQuery, {
    variables: {
      id: pollId,
    },
    pollInterval,
  });

  const { data: currentRoundData } = useQuery(gql`
    {
      protocol(id: "0") {
        id
        currentRound {
          id
        }
      }
    }
  `);

  const q = accountQuery(currentRoundData?.protocol.currentRound.id);

  const {
    data: myAccountData,
    startPolling: startPollingMyAccount,
    stopPolling: stopPollingMyAccount,
  } = useQuery(q, {
    variables: {
      account: accountAddress?.toLowerCase(),
    },
    pollInterval,
    skip: !accountAddress,
  });

  const {
    data: voteData,
    startPolling: startPollingVote,
    stopPolling: stopPollingVote,
  } = useQuery(voteQuery, {
    variables: {
      id: `${accountAddress?.toLowerCase()}-${pollId}`,
    },
    pollInterval,
    skip: !accountAddress,
  });

  const {
    data: delegateVoteData,
    startPolling: startPollingDelegate,
    stopPolling: stopPollingDelegate,
  } = useQuery(voteQuery, {
    variables: {
      id: `${myAccountData?.delegator?.delegate?.id.toLowerCase()}-${pollId}`,
    },
    pollInterval,
    skip: !myAccountData?.delegator?.delegate,
  });

  useEffect(() => {
    if (!isVisible) {
      stopPollingPoll();
      stopPollingMyAccount();
      stopPollingVote();
      stopPollingDelegate();
    } else {
      startPollingPoll(pollInterval);
      startPollingMyAccount(pollInterval);
      startPollingVote(pollInterval);
      startPollingDelegate(pollInterval);
    }
  }, [
    isVisible,
    stopPollingPoll,
    stopPollingMyAccount,
    stopPollingVote,
    stopPollingDelegate,
    startPollingPoll,
    startPollingMyAccount,
    startPollingVote,
    startPollingDelegate,
  ]);

  useEffect(() => {
    const init = async () => {
      if (data) {
        const response = await transformData({
          poll: data.poll,
        });
        setPollData(response);
      }
    };
    init();
  }, [data]);

  if (!query?.poll) {
    return <FourZeroFour />;
  }

  if (!pollData) {
    return (
      <Flex
        css={{
          height: "calc(100vh - 100px)",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          "@bp3": {
            height: "100vh",
          },
        }}
      >
        <Spinner />
      </Flex>
    );
  }

  const noVoteStake = +pollData?.tally?.no || 0;
  const yesVoteStake = +pollData?.tally?.yes || 0;
  const totalVoteStake = noVoteStake + yesVoteStake;

  return (
    <>
      <Head>
        <title>Livepeer Explorer - Voting</title>
      </Head>
      <Container size="3" css={{ mt: "$4", width: "100%" }}>
        <Flex>
          <Flex
            css={{
              flexDirection: "column",
              mb: "$6",
              pr: 0,
              pt: "$2",
              width: "100%",
              "@bp3": {
                pr: "$7",
              },
            }}
          >
            <Box css={{ mb: "$4" }}>
              <Flex
                css={{
                  mb: "$2",
                  alignItems: "center",
                }}
              >
                <Badge
                  size="2"
                  variant={
                    pollData.status === "rejected"
                      ? "red"
                      : pollData.stats === "active"
                      ? "blue"
                      : "primary"
                  }
                  css={{ textTransform: "capitalize", fontWeight: 700 }}
                >
                  {pollData.status}
                </Badge>
              </Flex>
              <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
                {pollData.title} (LIP-{pollData.lip})
              </Heading>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                {!pollData.isActive ? (
                  <Box>
                    Voting ended on{" "}
                    {moment.unix(pollData.endTime).format("MMM Do, YYYY")} at
                    block #{pollData.endBlock}
                  </Box>
                ) : (
                  <Box>
                    Voting ends in ~
                    {moment()
                      .add(pollData.estimatedTimeRemaining, "seconds")
                      .fromNow(true)}
                  </Box>
                )}
              </Text>
              {pollData.isActive && (
                <Button
                  size="4"
                  variant="primary"
                  css={{
                    display: "flex",
                    mt: "$3",
                    mr: "$3",
                    "@bp3": {
                      display: "none",
                    },
                  }}
                  onClick={() =>
                    client.writeQuery({
                      query: gql`
                        query {
                          bottomDrawerOpen
                        }
                      `,
                      data: {
                        bottomDrawerOpen: true,
                      },
                    })
                  }
                >
                  Vote
                </Button>
              )}
            </Box>

            <Box>
              <Box
                css={{
                  display: "grid",
                  gridGap: "$3",
                  gridTemplateColumns: "100%",
                  mb: "$3",
                  "@bp2": {
                    gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
                  },
                }}
              >
                <Stat
                  css={{ flex: 1, mb: 0 }}
                  label={
                    <Box>Total Support ({pollData.quota / 10000}% needed)</Box>
                  }
                  value={<Box>{pollData.totalSupport.toPrecision(5)}%</Box>}
                  meta={
                    <Box css={{ mt: "$4" }}>
                      <Flex
                        css={{
                          fontSize: "$2",
                          mb: "$2",
                          justifyContent: "space-between",
                          color: "$hiContrast",
                        }}
                      >
                        <Flex css={{ alignItems: "center" }}>
                          <Box>
                            Yes (
                            {isNaN(yesVoteStake / totalVoteStake)
                              ? 0
                              : (
                                  (yesVoteStake / totalVoteStake) *
                                  100
                                ).toPrecision(5)}
                            %)
                          </Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(yesVoteStake, 4)} LPT
                        </Box>
                      </Flex>
                      <Flex
                        css={{
                          fontSize: "$2",
                          justifyContent: "space-between",
                          color: "$hiContrast",
                        }}
                      >
                        <Flex css={{ alignItems: "center" }}>
                          <Box>
                            No (
                            {isNaN(noVoteStake / totalVoteStake)
                              ? 0
                              : (
                                  (noVoteStake / totalVoteStake) *
                                  100
                                ).toPrecision(5)}
                            %)
                          </Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(noVoteStake, 4)} LPT
                        </Box>
                      </Flex>
                    </Box>
                  }
                />

                <Stat
                  css={{ flex: 1, mb: 0 }}
                  label={
                    <Box>
                      Total Participation ({pollData.quorum / 10000}% needed)
                    </Box>
                  }
                  value={
                    <Box>{pollData.totalParticipation.toPrecision(5)}%</Box>
                  }
                  meta={
                    <Box css={{ mt: "$4" }}>
                      <Flex
                        css={{
                          fontSize: "$2",
                          mb: "$2",
                          justifyContent: "space-between",
                          color: "$hiContrast",
                        }}
                      >
                        <Box as="span" css={{ color: "$muted" }}>
                          Voters ({pollData.totalParticipation.toPrecision(5)}
                          %)
                        </Box>
                        <Box as="span">
                          <Box as="span">
                            {abbreviateNumber(totalVoteStake, 4)} LPT
                          </Box>
                        </Box>
                      </Flex>
                      <Flex
                        css={{
                          fontSize: "$2",
                          justifyContent: "space-between",
                          color: "$hiContrast",
                        }}
                      >
                        <Box as="span" css={{ color: "$muted" }}>
                          Nonvoters ({pollData.nonVoters.toPrecision(5)}
                          %)
                        </Box>
                        <Box as="span">
                          <Box as="span">
                            {abbreviateNumber(pollData.nonVotersStake, 4)} LPT
                          </Box>
                        </Box>
                      </Flex>
                    </Box>
                  }
                />
              </Box>
              <Card
                css={{
                  p: "$4",
                  border: "1px solid $neutral4",
                  mb: "$3",
                  h2: {
                    fontWeight: 600,
                    "&:first-of-type": { mt: 0 },
                    mt: "$3",
                  },
                  h3: { fontWeight: 600, mt: "$3" },
                  h4: { fontWeight: 600, mt: "$3" },
                  h5: { fontWeight: 600, mt: "$3" },
                  lineHeight: 1.5,
                  a: {
                    color: "$primary11",
                  },
                  pre: {
                    whiteSpace: "pre-wrap",
                  },
                }}
              >
                <ReactMarkdown source={pollData.text} />
              </Card>
            </Box>
          </Flex>

          {width > 1200 ? (
            <Flex
              css={{
                display: "none",
                "@bp3": {
                  position: "sticky",
                  alignSelf: "flex-start",
                  top: "$9",
                  mt: "$6",
                  width: "40%",
                  display: "flex",
                },
              }}
            >
              <VotingWidget
                data={{
                  poll: pollData,
                  delegateVote: delegateVoteData?.vote,
                  vote: voteData?.vote,
                  myAccount: myAccountData,
                }}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <VotingWidget
                data={{
                  poll: pollData,
                  delegateVote: delegateVoteData?.vote,
                  vote: voteData?.vote,
                  myAccount: myAccountData,
                }}
              />
            </BottomDrawer>
          )}
        </Flex>
      </Container>
    </>
  );
};

async function transformData({ poll }) {
  const noVoteStake = +poll?.tally?.no || 0;
  const yesVoteStake = +poll?.tally?.yes || 0;
  const totalVoteStake = +poll?.totalVoteStake;
  const totalNonVoteStake = +poll?.totalNonVoteStake;
  const totalSupport = isNaN(yesVoteStake / totalVoteStake)
    ? 0
    : (yesVoteStake / totalVoteStake) * 100;
  const totalStake = totalNonVoteStake + totalVoteStake;
  const totalParticipation = (totalVoteStake / totalStake) * 100;
  const nonVotersStake = totalStake - totalVoteStake;
  const nonVoters = ((totalStake - totalVoteStake) / totalStake) * 100;

  const ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
  });
  const { gitCommitHash, text } = await ipfs.catJSON(poll.proposal);
  const response = fm(text);
  return {
    ...response.attributes,
    created: response.attributes.created.toString(),
    text: response.body,
    gitCommitHash,
    totalStake,
    totalSupport,
    totalParticipation,
    nonVoters,
    nonVotersStake,
    yesVoteStake,
    noVoteStake,
    ...poll,
  };
}

Poll.getLayout = getLayout;

export default Poll;
