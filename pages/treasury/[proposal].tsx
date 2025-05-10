import { getLayout, LAYOUT_MAX_WIDTH } from "@layouts/main";
import { useRouter } from "next/router";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { abbreviateNumber, fromWei, shortenAddress } from "@lib/utils";
import MarkdownRenderer from "@components/MarkdownRenderer";
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
  Link,
  Text,
} from "@livepeer/design-system";
import dayjs from "dayjs";
import Head from "next/head";
import { useWindowSize } from "react-use";
import {
  useAccountAddress,
  useContractInfoData,
  useCurrentRoundData,
  useEnsData,
  useExplorerStore,
  useProposalVotingPowerData,
  useTreasuryProposalState,
} from "../../hooks";
import { useFetchVotes } from '../../hooks/TreasuryVotes/useFetchVotes';
import FourZeroFour from "../404";
import { useProtocolQuery, useTreasuryProposalQuery } from "apollo";
import { sentenceCase } from "change-case";
import relativeTime from "dayjs/plugin/relativeTime";
import numeral from "numeral";
import { BadgeVariantByState } from "@components/TreasuryProposalRow";
import VoteList from "@components/Votes/voteTable"; 
import TreasuryVotingWidget from "@components/TreasuryVotingWidget";
import { getProposalExtended } from "@lib/api/treasury";
import { decodeFunctionData } from "viem";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { CHAIN_INFO, DEFAULT_CHAIN, DEFAULT_CHAIN_ID } from "@lib/chains";
import { BigNumber } from "ethers";

dayjs.extend(relativeTime);

const formatPercent = (percent: number) => numeral(percent).format("0.0000%");

const blockExplorerLink = (address: string) =>
  `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${address}`;

const formatDateTime = (date: dayjs.Dayjs) => {
  const now = dayjs();
  let str = date.format("MMM D, YYYY");
  if (date.isAfter(now) && date.diff(now, "hour") < 24) {
    str += ` (in ${dayjs.duration(date.diff()).humanize()})`;
  }
  return str;
};

const Proposal = () => {
  const router = useRouter();
  const { width } = useWindowSize();
  const [isDesktop, setIsDesktop] = useState(false);
  const { setBottomDrawerOpen } = useExplorerStore();

  const { query } = router;

  const proposalId = query?.proposal?.toString().toLowerCase();

  const accountAddress = useAccountAddress();
  const contractAddresses = useContractInfoData();
  const { data: proposalQuery, error: proposalError } =
    useTreasuryProposalQuery({
      variables: { id: proposalId ?? "" },
      skip: !proposalId,
    });
  const { data: state, error: stateError } =
    useTreasuryProposalState(proposalId);
  const votingPower = useProposalVotingPowerData(proposalId, accountAddress);
  const { data: protocolQuery } = useProtocolQuery();
  const currentRound = useCurrentRoundData();

  const { votes, loading: votesLoading } = useFetchVotes(proposalId ?? "");
  const [votesOpen, setVotesOpen] = useState(false);
  
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

  const proposerId = useEnsData(proposal?.proposer.id);

  const votesContent = useCallback(() => {
    if (votesLoading) {
      return (
        <Flex
          css={{
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
            padding: "$4",
          }}
        >
          <Spinner />
        </Flex>
      );
    }
    if (votes.length === 0) return <Text>No votes yet.</Text>;
    return <VoteList proposalId={proposal!.id} />;
  }, [votesLoading, votes.length, proposal?.id]);

  const actions = useMemo(() => {
    if (!proposal || !contractAddresses) {
      return null;
    }

    return proposal.targets.map((target, idx) => {
      const [value, calldata] = [proposal.values[idx], proposal.calldatas[idx]];

      const contract = Object.values(contractAddresses).find(
        (ctr) => ctr?.address?.toLowerCase() === target.toLowerCase()
      );
      if (contract !== contractAddresses?.LivepeerToken) {
        return { target, contract, value, calldata };
      }

      const { functionName, args } = decodeFunctionData({
        abi: livepeerToken,
        data: calldata,
      });
      if (functionName === "transfer" && BigNumber.from(value).isZero()) {
        return {
          lptTransfer: {
            receiver: args[0],
            amount: args[1],
          },
        };
      }
      return { target, contract, value, calldata, functionName, args };
    });
  }, [contractAddresses, proposal]);

  if (stateError || proposalError) {
    return <FourZeroFour />;
  }

  useEffect(() => {
    setIsDesktop(width >= 768);
  }, [width]);

  if (!proposal) {
    return (
      <>
        <Head>
          <title>Livepeer Explorer - Treasury</title>
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
        <title>Livepeer Explorer - Treasury</title>
      </Head>
      <Container css={{ maxWidth: LAYOUT_MAX_WIDTH, marginTop: "$4", width: "100%" }}>
        <Flex>
          <Flex
            css={{
              flexDirection: "column",
              marginBottom: "$6",
              paddingRight: 0,
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
                Proposed by{" "}
                <Link href={`/accounts/${proposal.proposer.id}`}>
                  {proposerId?.name ?? shortenAddress(proposal.proposer.id)}
                </Link>
              </Text>
              <Text css={{ fontSize: "$1", color: "$neutral11" }}>
                {proposal.state === "Pending" ? (
                  <Box>
                    Voting starts on{" "}
                    {formatDateTime(proposal.votes.voteStartTime)}
                  </Box>
                ) : proposal.state === "Active" ? (
                  <Box>
                    Voting ongoing until ~
                    {formatDateTime(proposal.votes.voteEndTime)}
                  </Box>
                ) : (
                  <Box>
                    Voting ended on {formatDateTime(proposal.votes.voteEndTime)}
                  </Box>
                )}
              </Text>
              {proposal.state === "Active" && (
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
                    <Box>
                      Total Support ({formatPercent(+proposal.quota / 1000000)}
                      needed)
                    </Box>
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
                          marginBottom: "$2",
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
                      {formatPercent(
                        +proposal.quorum / +proposal.totalVoteSupply
                      )}
                      needed)
                    </Box>
                  }
                  value={
                    <Box>{formatPercent(proposal.votes.percent.voters)}</Box>
                  }
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
                  marginBottom: "$3",
                  color: "$neutral9",
                  padding: "$3",
                  boxShadow: "$colors$neutral5 0px 0px 0px 1px inset",
                }}
              >
                <Heading
                  css={{
                    fontSize: "$2",
                    color: "$neutral9",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: "$2",
                  }}
                >
                  Actions
                </Heading>

                {!actions && <Spinner css={{ ml: "$3" }} />}

                {actions?.map((action, idx) => (
                  <Box
                    css={{
                      borderBottom:
                        idx + 1 < proposal.targets.length
                          ? "1px solid $neutral4"
                          : "",
                    }}
                    key={"target-" + idx}
                  >
                    {action.lptTransfer ? (
                      <>
                        <Text css={{ marginBottom: "0.4em" }} variant="neutral" size="3">
                          LPT Transfer:
                        </Text>
                        <Flex css={{ paddingLeft: "$2", marginBottom: "0.2em" }}>
                          <Text variant="neutral" size="3">
                            Receiver:
                          </Text>
                          <Link
                            css={{
                              marginLeft: "auto",
                            }}
                            href={blockExplorerLink(
                              action.lptTransfer.receiver
                            )}
                            target="_blank"
                          >
                            <Text
                              css={{
                                display: "block",
                                fontWeight: 600,
                                color: "$white",
                              }}
                              size="2"
                            >
                              {width <= 640
                                ? shortenAddress(action.lptTransfer.receiver)
                                : action.lptTransfer.receiver}
                            </Text>
                          </Link>
                        </Flex>
                        <Flex css={{ paddingLeft: "$2", marginBottom: "0.2em" }}>
                          <Text variant="neutral" size="3">
                            Amount:
                          </Text>
                          <Text
                            css={{
                              display: "block",
                              fontWeight: 600,
                              color: "$white",
                              marginLeft: "auto",
                            }}
                            size="2"
                          >
                            {fromWei(action.lptTransfer.amount)} LPT
                          </Text>
                        </Flex>
                      </>
                    ) : (
                      <>
                        <Text css={{ marginBottom: "0.4em" }} variant="neutral" size="3">
                          Custom:
                        </Text>
                        <Flex css={{ paddingLeft: "$2", marginBottom: "0.2em" }}>
                          <Text variant="neutral" size="3">
                            Target:
                          </Text>
                          <Link
                            css={{
                              marginLeft: "auto",
                            }}
                            href={
                              action.contract?.link ??
                              blockExplorerLink(action.target)
                            }
                            target="_blank"
                          >
                            <Text
                              css={{
                                display: "block",
                                fontWeight: 600,
                                color: "$white",
                              }}
                              size="2"
                            >
                              {action.contract
                                ? `${action.contract?.name} (${shortenAddress(
                                    action.target
                                  )})`
                                : action.target}
                            </Text>
                          </Link>
                        </Flex>
                        <Flex css={{ paddingLeft: "$2", marginBottom: "0.2em" }}>
                          <Text variant="neutral" size="3">
                            Value:
                          </Text>
                          <Text
                            css={{
                              display: "block",
                              fontWeight: 600,
                              color: "$white",
                              marginLeft: "auto",
                            }}
                            size="2"
                          >
                            {fromWei(action.value)}{" "}
                            {DEFAULT_CHAIN.nativeCurrency.symbol}
                          </Text>
                        </Flex>
                        {action.functionName ? (
                          <Flex css={{ paddingLeft: "$2", marginBottom: "0.2em" }}>
                            <Text variant="neutral" size="3">
                              Function:
                            </Text>
                            <Text
                              css={{
                                display: "block",
                                fontWeight: 600,
                                color: "$white",
                                marginLeft: "auto",
                                maxWidth: "50%",
                                textAlign: "right",
                              }}
                              size="2"
                            >
                              {action.functionName}(
                              {action.args?.join(", ") ?? ""})
                            </Text>
                          </Flex>
                        ) : (
                          <>
                            <Flex css={{ paddingLeft: "$2", marginBottom: "0.2em" }}>
                              <Text variant="neutral" size="3">
                                Calldata:
                              </Text>
                              <Text
                                css={{
                                  display: "block",
                                  fontWeight: 600,
                                  color: "$white",
                                  marginLeft: "auto",
                                  maxWidth: "50%",
                                  wordBreak: "break-all",
                                  textAlign: "right",
                                }}
                                size="2"
                              >
                                {action.calldata}
                              </Text>
                            </Flex>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                ))}
              </Card>
              <Card
                css={{
                  padding: "$4",
                  border: "1px solid $neutral4",
                  marginBottom: "$3",
                }}
              >
                <Heading
                  css={{
                    fontSize: "$2",
                    color: "$neutral9",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: "$2",
                  }}
                >
                  Description
                </Heading>
                <MarkdownRenderer>
                  {proposal.description}
                </MarkdownRenderer>
              </Card>
             
              <Card
  css={{
    padding: "$4",
    border: "1px solid $neutral4",
    cursor: "pointer",
  }}
  onClick={() => setVotesOpen(!votesOpen)}
>
  <Flex
    css={{
      marginTop: "$1",
      alignItems: "center",
    }}
  >
    <Heading
  as="h3"
  css={{
    fontWeight: 700,
    fontSize: "$5",
    display: "flex",
    alignItems: "center",
  }}
>
<Box css={{ display: "flex", alignItems: "center" }} as="span">
{votesLoading ? "Loading votes…" : `View Votes (${votes.length})`}
</Box>

  <Text
    as="span"
    css={{
      color: votesOpen ? "$red9" : "$green9",
      fontSize: "$3",
      marginLeft: "$2",
    }}
  >
    {votesOpen ? "–" : "+"}
  </Text>
</Heading>

  </Flex>
  {votesOpen && <Box css={{ padding: "$3" }}>{votesContent()}</Box>}
</Card>

            </Box>
            
          </Flex>

          {isDesktop ? (
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

Proposal.getLayout = getLayout;

export default Proposal;
