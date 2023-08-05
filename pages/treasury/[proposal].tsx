import VotingWidget from "@components/VotingWidget";
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
import { useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";
import {
  useAccountAddress,
  useCurrentRoundData,
  useExplorerStore,
  useTreasuryProposalData,
  useTreasuryProposalStateData,
} from "../../hooks";
import FourZeroFour from "../404";

import { getPollExtended, PollExtended } from "@lib/api/polls";
import { useAccountQuery, usePollQuery, useProtocolQuery, useVoteQuery } from "apollo";
import { sentenceCase } from "change-case";
import relativeTime from "dayjs/plugin/relativeTime";
import numeral from "numeral";
import { getProposalTextAttributes, getProposalVoteCounts } from "@lib/api/treasury";
import { BadgeVariantByState } from "@components/TreasuryProposalRow";
dayjs.extend(relativeTime);

const formatPercent = (percent: number) => numeral(percent).format("0.0000%");

const Poll = () => {
  const router = useRouter();
  const { width } = useWindowSize();
  const { setBottomDrawerOpen } = useExplorerStore();

  const { query } = router;

  const proposalId = query?.proposal?.toString().toLowerCase();

  const proposal = useTreasuryProposalData(proposalId);
  const state = useTreasuryProposalStateData(proposalId);
  const protocol = useProtocolQuery();
  const currentRound = useCurrentRoundData();

  const isLoading = !proposal || !state || !protocol?.data || !currentRound;

  const attributes = useMemo(() => (isLoading ? null : getProposalTextAttributes(proposal)), [isLoading, proposal]);
  const voteCounts = useMemo(
    () => (isLoading ? null : getProposalVoteCounts(proposal, state, currentRound, protocol.data ?? ({} as any))),
    [isLoading, currentRound, protocol, proposal, state]
  );
  console.log({ voteCounts, proposal, state, currentRound, protocol });

  if (!proposalId) {
    return <FourZeroFour />;
  }

  if (isLoading || !attributes || !voteCounts) {
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
                  {sentenceCase(state.state)}
                </Badge>
              </Flex>
              <Heading size="2" css={{ mb: "$2", fontWeight: 600 }}>
                {attributes.title}
                {!attributes.lip ? "" : ` (LIP ${attributes.lip})`}
              </Heading>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                {isLoading ? (
                  <Box>Loading...</Box>
                ) : !["Pending", "Active"].includes(state?.state) ? (
                  <Box>Voting ended on {dayjs.unix(voteCounts.estimatedEndTime).format("MMM D, YYYY")}</Box>
                ) : (
                  <Box>Voting ongoing until ~${dayjs.unix(voteCounts.estimatedEndTime).format("MMM D, YYYY")}</Box>
                )}
              </Text>
              {state.state === "Active" && (
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
                  label={<Box>Total Support ({+state.quota / 10000}% needed)</Box>}
                  value={<Box>{formatPercent(voteCounts.percent.for)}</Box>}
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
                          <Box>For ({formatPercent(voteCounts.percent.for)})</Box>
                        </Flex>
                        <Box as="span">{abbreviateNumber(voteCounts.total.for, 4)} LPT</Box>
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
                          <Box>Against ({formatPercent(voteCounts.percent.against)})</Box>
                        </Flex>
                        <Box as="span">{abbreviateNumber(voteCounts.total.against, 4)} LPT</Box>
                      </Flex>
                      <Flex
                        css={{
                          fontSize: "$2",
                          justifyContent: "space-between",
                          color: "$hiContrast",
                        }}
                      >
                        <Flex css={{ alignItems: "center" }}>
                          <Box>Abstain ({formatPercent(voteCounts.percent.abstain)})</Box>
                        </Flex>
                        <Box as="span">{abbreviateNumber(voteCounts.total.abstain, 4)} LPT</Box>
                      </Flex>
                    </Box>
                  }
                />

                <Stat
                  css={{ flex: 1, mb: 0 }}
                  label={<Box>Total Participation ({(+state.quorum / +state.totalVoteSupply) * 100}% needed)</Box>}
                  value={<Box>{formatPercent(voteCounts.percent.voters)}</Box>}
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
                          Voters ({formatPercent(voteCounts.percent.voters)})
                        </Box>
                        <Box as="span">
                          <Box as="span">{abbreviateNumber(voteCounts.total.voters, 4)} LPT</Box>
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
                          Nonvoters ({formatPercent(voteCounts.percent.nonVoters)})
                        </Box>
                        <Box as="span">
                          <Box as="span">{abbreviateNumber(voteCounts.total.nonVoters, 4)} LPT</Box>
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
                <ReactMarkdown>{attributes?.text ?? ""}</ReactMarkdown>
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
              {/* <VotingWidget data={{} as any} /> */}
            </Flex>
          ) : (
            <BottomDrawer>{/* <VotingWidget data={{} as any} /> */}</BottomDrawer>
          )}
        </Flex>
      </Container>
    </>
  );
};

Poll.getLayout = getLayout;

export default Poll;
