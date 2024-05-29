import VotingWidget from "@components/VotingWidget";
import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
import {
  useAccountAddress,
  useCurrentRoundData,
  useExplorerStore,
} from "../../hooks";
import FourZeroFour from "../404";

import { getPollExtended, PollExtended } from "@lib/api/polls";
import { useAccountQuery, usePollQuery, useVoteQuery } from "apollo";
import { sentenceCase } from "change-case";
import relativeTime from "dayjs/plugin/relativeTime";
import numeral from "numeral";
dayjs.extend(relativeTime);

const formatPercent = (percent: number) => numeral(percent).format("0.0000%");

const Poll = () => {
  const router = useRouter();
  const accountAddress = useAccountAddress();

  const { width } = useWindowSize();

  const [pollData, setPollData] = useState<PollExtended | null>(null);
  const { query } = router;

  const pollId = query?.poll?.toString().toLowerCase();
  const pollInterval = 10000;

  const { setBottomDrawerOpen } = useExplorerStore();

  const { data, error: pollError } = usePollQuery({
    variables: {
      id: pollId ?? "",
    },
    pollInterval,
    skip: !pollId,
  });

  const { data: myAccountData } = useAccountQuery({
    variables: {
      account: accountAddress?.toLowerCase() ?? "",
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

  const currentRound = useCurrentRoundData();

  useEffect(() => {
    const init = async () => {
      if (data && currentRound?.currentL1Block) {
        const response = await getPollExtended(
          data.poll,
          currentRound.currentL1Block
        );
        setPollData(response);
      }
    };
    init();
  }, [data, currentRound?.currentL1Block]);

  if (pollError) {
    return <FourZeroFour />;
  }

  if (!pollData) {
    return (
      <>
        <Head>
          <title>Livepeer Explorer - Voting</title>
        </Head>
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
      </>
    );
  }

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
                width: "75%",
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
                      : pollData.status === "active"
                      ? "blue"
                      : pollData.status === "passed"
                      ? "primary"
                      : "neutral"
                  }
                  css={{ textTransform: "capitalize", fontWeight: 700 }}
                >
                  {sentenceCase(pollData.status)}
                </Badge>
              </Flex>
              <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
                {pollData.attributes?.title} (LIP-{pollData.attributes?.lip})
              </Heading>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                {pollData.status !== "active" ? (
                  <Box>
                    Voting ended on{" "}
                    {dayjs
                      .unix(pollData.estimatedEndTime)
                      .format("MMM D, YYYY")}{" "}
                    at block #{pollData.endBlock}.
                  </Box>
                ) : (
                  <Box>
                    Voting ends in ~
                    {dayjs.unix(pollData.estimatedEndTime).fromNow(true)}
                  </Box>
                )}
              </Text>
              {pollData.status === "active" && (
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
                    <Box>Total Support ({+pollData.quota / 10000}% needed)</Box>
                  }
                  value={<Box>{formatPercent(pollData.percent.yes)}</Box>}
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
                          <Box>Yes ({formatPercent(pollData.percent.yes)})</Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(pollData.stake.yes, 4)} LPT
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
                          <Box>No ({formatPercent(pollData.percent.no)})</Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(pollData.stake.no, 4)} LPT
                        </Box>
                      </Flex>
                    </Box>
                  }
                />

                <Stat
                  css={{ flex: 1, mb: 0 }}
                  label={
                    <Box>
                      Total Participation ({+pollData.quorum / 10000}% needed)
                    </Box>
                  }
                  value={<Box>{formatPercent(pollData.percent.voters)}</Box>}
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
                          Voters ({formatPercent(pollData.percent.voters)})
                        </Box>
                        <Box as="span">
                          <Box as="span">
                            {abbreviateNumber(pollData.stake.voters, 4)} LPT
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
                          Nonvoters ({formatPercent(pollData.percent.nonVoters)}
                          )
                        </Box>
                        <Box as="span">
                          <Box as="span">
                            {abbreviateNumber(pollData.stake.nonVoters, 4)} LPT
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
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {pollData.attributes?.text ?? ""}
                </ReactMarkdown>
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
                  width: "25%",
                  display: "flex",
                },
              }}
            >
              <VotingWidget
                data={{
                  poll: pollData,
                  delegateVote: delegateVoteData?.vote as any,
                  vote: voteData?.vote as any,
                  myAccount: myAccountData as any,
                }}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <VotingWidget
                data={{
                  poll: pollData,
                  delegateVote: delegateVoteData?.vote as any,
                  vote: voteData?.vote as any,
                  myAccount: myAccountData as any,
                }}
              />
            </BottomDrawer>
          )}
        </Flex>
      </Container>
    </>
  );
};

Poll.getLayout = getLayout;

export default Poll;
