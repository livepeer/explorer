import BottomDrawer from "@components/BottomDrawer";
import MarkdownRenderer from "@components/MarkdownRenderer";
import Spinner from "@components/Spinner";
import Stat from "@components/Stat";
import VotingWidget from "@components/VotingWidget";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { getLayout } from "@layouts/main";
import { getPollExtended, PollExtended } from "@lib/api/polls";
import dayjs from "@lib/dayjs";
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
import {
  AccountQuery,
  PollChoice,
  useAccountQuery,
  usePollQuery,
  useVoteQuery,
} from "apollo";
import { sentenceCase } from "change-case";
import Head from "next/head";
import { useRouter } from "next/router";
import numbro from "numbro";
import { useEffect, useState } from "react";
import { useWindowSize } from "react-use";

import {
  useAccountAddress,
  useCurrentRoundData,
  useExplorerStore,
} from "../../hooks";
import { abbreviateNumber } from "../../lib/utils";
import FourZeroFour from "../404";

const formatPercent = (percent: number) =>
  numbro(percent).format({
    output: "percent",
    mantissa: 4,
  });

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
      <Container
        css={{ maxWidth: LAYOUT_MAX_WIDTH, marginTop: "$4", width: "100%" }}
      >
        <Flex>
          <Flex
            css={{
              flexDirection: "column",
              marginBottom: "$6",
              paddingRight: "0px",
              paddingTop: "$2",
              width: "100%",
              "@bp3": {
                width: "75%",
                paddingRight: "$7",
              },
            }}
          >
            <Box css={{ marginBottom: "$4" }}>
              <Flex
                css={{
                  marginBottom: "$2",
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
                    marginTop: "$3",
                    marginRight: "$3",
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
                  marginBottom: "$3",
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
                    <Box css={{ marginTop: "$4" }}>
                      <Flex
                        css={{
                          fontSize: "$2",
                          marginBottom: "$2",
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
                    <Box css={{ marginTop: "$4" }}>
                      <Flex
                        css={{
                          fontSize: "$2",
                          marginBottom: "$2",
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
                  padding: "$4",
                  border: "1px solid $neutral4",
                  marginBottom: "$3",
                  wordWrap: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                <MarkdownRenderer>
                  {pollData.attributes?.text ?? ""}
                </MarkdownRenderer>
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
                  marginTop: "$6",
                  width: "25%",
                  display: "flex",
                },
              }}
            >
              <VotingWidget
                data={{
                  poll: pollData,
                  delegateVote: delegateVoteData?.vote as
                    | {
                        __typename: "Vote";
                        choiceID?: PollChoice;
                        voteStake: string;
                        nonVoteStake: string;
                      }
                    | undefined
                    | null,
                  vote: voteData?.vote as
                    | {
                        __typename: "Vote";
                        choiceID?: PollChoice;
                        voteStake: string;
                        nonVoteStake: string;
                      }
                    | undefined
                    | null,
                  myAccount: myAccountData as AccountQuery,
                }}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <VotingWidget
                data={{
                  poll: pollData,
                  delegateVote: delegateVoteData?.vote as
                    | {
                        __typename: "Vote";
                        choiceID?: PollChoice;
                        voteStake: string;
                        nonVoteStake: string;
                      }
                    | undefined
                    | null,
                  vote: voteData?.vote as
                    | {
                        __typename: "Vote";
                        choiceID?: PollChoice;
                        voteStake: string;
                        nonVoteStake: string;
                      }
                    | undefined
                    | null,
                  myAccount: myAccountData as AccountQuery,
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
