import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useRouter } from "next/router";
import ReactMarkdown from "react-markdown";
import { abbreviateNumber } from "../../lib/utils";

import BottomDrawer from "@components/BottomDrawer";
import Spinner from "@components/Spinner";
import Stat from "@components/Stat";
import { Badge, Box, Button, Card, Container, Flex, Heading, Text } from "@livepeer/design-system";
import dayjs from "dayjs";
import Head from "next/head";
import { useMemo } from "react";
import { useWindowSize } from "react-use";
import {
  useAccountAddress,
  useCurrentRoundData,
  useExplorerStore,
  useProposalVotingPowerData,
  useTreasuryProposalState,
} from "../../hooks";
import FourZeroFour from "../404";

import { useProtocolQuery, useTreasuryProposalQuery } from "apollo";
import { sentenceCase } from "change-case";
import relativeTime from "dayjs/plugin/relativeTime";
import numeral from "numeral";
import { BadgeVariantByState } from "@components/TreasuryProposalRow";
import TreasuryVotingWidget from "@components/TreasuryVotingWidget";
import {
  getProposalExtended,
} from "@lib/api/treasury";

dayjs.extend(relativeTime);

const formatPercent = (percent: number) => numeral(percent).format("0.0000%");

const Poll = () => {
  const router = useRouter();
  const { width } = useWindowSize();
  const { setBottomDrawerOpen } = useExplorerStore();

  const { query } = router;

  const proposalId = query?.proposal?.toString().toLowerCase();

  const accountAddress = useAccountAddress();
  const { data: proposalQuery } = useTreasuryProposalQuery({
    variables: { id: proposalId ?? "" },
    skip: !proposalId,
  });
  const { data: state } = useTreasuryProposalState(proposalId);
  const votingPower = useProposalVotingPowerData(proposalId, accountAddress);
  const { data: protocolQuery } = useProtocolQuery();
  const currentRound = useCurrentRoundData();

  const proposal = useMemo(() => {
    if (!proposalQuery || !state || !protocolQuery || !currentRound) {
      return null;
    }
    return getProposalExtended(
      proposalQuery.treasuryProposal!,
      state,
      currentRound,
      protocolQuery.protocol
    );
  }, [proposalQuery, state, currentRound, protocolQuery]);

  if (!proposalId) {
    return <FourZeroFour />;
  }

  if (!proposal) {
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
                  variant={BadgeVariantByState[state?.state ?? ""] || "neutral"}
                  css={{ textTransform: "capitalize", fontWeight: 700 }}
                >
                  {sentenceCase(proposal.state)}
                </Badge>
              </Flex>
              <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
                {proposal.attributes.title}
                {!proposal.attributes.lip
                  ? ""
                  : ` (LIP ${proposal.attributes.lip})`}
              </Heading>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                {!["Pending", "Active"].includes(proposal.state) ? (
                  <Box>
                    Voting ended on{" "}
                    {dayjs
                      .unix(proposal.votes.estimatedEndTime)
                      .format("MMM D, YYYY")}
                  </Box>
                ) : (
                  <Box>
                    Voting ongoing until ~$
                    {dayjs
                      .unix(proposal.votes.estimatedEndTime)
                      .format("MMM D, YYYY")}
                  </Box>
                )}
              </Text>
              {proposal.state === "Active" && (
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
                    <Box>Total Support ({+proposal.quota / 10000}% needed)</Box>
                  }
                  value={
                    <Box>
                      {formatPercent(
                        proposal.votes.total.for /
                          proposal.votes.total.quotaVoters
                      )}
                    </Box>
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
                        <Flex css={{ alignItems: "center" }}>
                          <Box>
                            For ({formatPercent(proposal.votes.percent.for)})
                          </Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(proposal.votes.total.for, 4)} LPT
                        </Box>
                      </Flex>
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
                            Against (
                            {formatPercent(proposal.votes.percent.against)})
                          </Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(proposal.votes.total.against, 4)}{" "}
                          LPT
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
                            Abstain (
                            {formatPercent(proposal.votes.percent.abstain)})
                          </Box>
                        </Flex>
                        <Box as="span">
                          {abbreviateNumber(proposal.votes.total.abstain, 4)}{" "}
                          LPT
                        </Box>
                      </Flex>
                    </Box>
                  }
                />

                <Stat
                  css={{ flex: 1, mb: 0 }}
                  label={
                    <Box>
                      Total Participation (
                      {(+proposal.quorum / +proposal.totalVoteSupply) * 100}%
                      needed)
                    </Box>
                  }
                  value={
                    <Box>{formatPercent(proposal.votes.percent.voters)}</Box>
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
                          Voters ({formatPercent(proposal.votes.percent.voters)}
                          )
                        </Box>
                        <Box as="span">
                          <Box as="span">
                            {abbreviateNumber(proposal.votes.total.voters, 4)}{" "}
                            LPT
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
                          Nonvoters (
                          {formatPercent(proposal.votes.percent.nonVoters)})
                        </Box>
                        <Box as="span">
                          <Box as="span">
                            {abbreviateNumber(
                              proposal.votes.total.nonVoters,
                              4
                            )}{" "}
                            LPT
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
                <ReactMarkdown>{proposal.attributes?.text ?? ""}</ReactMarkdown>
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
              <TreasuryVotingWidget proposal={proposal} vote={votingPower} />
            </Flex>
          ) : (
            <BottomDrawer>
              <TreasuryVotingWidget proposal={proposal} vote={votingPower} />
            </BottomDrawer>
          )}
        </Flex>
      </Container>
    </>
  );
};

Poll.getLayout = getLayout;

export default Poll;
