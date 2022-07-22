import VotingWidget from "@components/VotingWidget";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import fm from "front-matter";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import { abbreviateNumber } from "../../lib/utils";

import BottomDrawer from "@components/BottomDrawer";
import Spinner from "@components/Spinner";
import Stat from "@components/Stat";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@livepeer/design-system";
import dayjs from "dayjs";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useWindowSize } from "react-use";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";
import { useAccountAddress, useExplorerStore } from "../../hooks";
import FourZeroFour from "../404";

import { useAccountQuery, usePollQuery, useVoteQuery } from "apollo";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const Poll = () => {
  const router = useRouter();
  const accountAddress = useAccountAddress();

  const { width } = useWindowSize();

  const [pollData, setPollData] = useState(null);
  const { query } = router;

  const pollId = query?.poll?.toString().toLowerCase();
  const pollInterval = 20000;

  const { setBottomDrawerOpen } = useExplorerStore();

  const { data } = usePollQuery({
    variables: {
      id: pollId,
    },
    pollInterval,
  });

  const { data: myAccountData } = useAccountQuery({
    variables: {
      account: accountAddress?.toLowerCase(),
    },
    pollInterval,
    skip: !accountAddress,
  });

  const { data: voteData } = useVoteQuery({
    variables: {
      id: `${accountAddress?.toLowerCase()}-${pollId}`,
    },
    pollInterval,
    skip: !accountAddress,
  });

  const { data: delegateVoteData } = useVoteQuery({
    variables: {
      id: `${myAccountData?.delegator?.delegate?.id.toLowerCase()}-${pollId}`,
    },
    pollInterval,
    skip: !myAccountData?.delegator?.delegate,
  });

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
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, mt: "$4", width: "100%" }}>
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
                    {dayjs.unix(pollData.endTime).format("MMM Do, YYYY")} at
                    block #{pollData.endBlock}
                  </Box>
                ) : (
                  <Box>
                    Voting ends in ~
                    {dayjs()
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
                  onClick={() => setBottomDrawerOpen(true)}
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
                <ReactMarkdown>{pollData.text}</ReactMarkdown>
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

  const { gitCommitHash, text } = await catIpfsJson<IpfsPoll>(poll?.proposal);

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
