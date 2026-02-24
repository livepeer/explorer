import BottomDrawer from "@components/BottomDrawer";
import HorizontalScrollContainer from "@components/HorizontalScrollContainer";
import MarkdownRenderer from "@components/MarkdownRenderer";
import Spinner from "@components/Spinner";
import Stat from "@components/Stat";
import { BadgeVariantByState } from "@components/Treasury/TreasuryProposalRow";
import TreasuryVoteTable from "@components/Treasury/TreasuryVoteTable";
import TreasuryVotingWidget from "@components/Treasury/TreasuryVotingWidget";
import { LAYOUT_MAX_WIDTH } from "@layouts/constants";
import { getLayout } from "@layouts/main";
import { livepeerToken } from "@lib/api/abis/main/LivepeerToken";
import { getProposalExtended } from "@lib/api/treasury";
import { CHAIN_INFO, DEFAULT_CHAIN, DEFAULT_CHAIN_ID } from "@lib/chains";
import dayjs from "@lib/dayjs";
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Link as A,
  Link,
  Text,
} from "@livepeer/design-system";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons";
import { formatLPT, formatPercent } from "@utils/numberFormatters";
import {
  formatAddress,
  fromWei,
  PERCENTAGE_PRECISION_MILLION,
} from "@utils/web3";
import {
  useProtocolQuery,
  useTreasuryProposalQuery,
  useTreasuryVotesQuery,
} from "apollo";
import { sentenceCase } from "change-case";
import { BigNumber } from "ethers";
import Head from "next/head";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useWindowSize } from "react-use";
import { decodeFunctionData } from "viem";

import {
  useAccountAddress,
  useContractInfoData,
  useCurrentRoundData,
  useEnsData,
  useExplorerStore,
  useProposalVotingPowerData,
  useTreasuryProposalState,
} from "../../hooks";
import FourZeroFour from "../404";

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
  const view = query?.view?.toString().toLowerCase() || "overview";

  const votesTabHref = useMemo(
    () => ({
      pathname: router.pathname,
      query: { ...query, view: "votes" },
    }),
    [router.pathname, query]
  );

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

  const { data: votes, loading: votesLoading } = useTreasuryVotesQuery({
    variables: {
      where: {
        proposal: proposalId ?? "",
      },
    },
    fetchPolicy: "cache-first",
  });

  useEffect(() => {
    setIsDesktop(width >= 768);
  }, [width]);

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
    if (!votes?.treasuryVotes?.length) return <Text>No votes yet.</Text>;
    return <TreasuryVoteTable proposalId={proposal!.id} />;
  }, [votesLoading, votes?.treasuryVotes?.length, proposal]);

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

  const tabs = useMemo(
    () => [
      {
        name: "Overview",
        href: {
          pathname: router.pathname,
          query: { ...query, view: "overview" },
        },
        isActive: view === "overview",
      },
      {
        name: "Votes",
        href: votesTabHref,
        isActive: view === "votes",
        count: votes?.treasuryVotes?.length,
      },
    ],
    [router.pathname, query, view, votes?.treasuryVotes?.length, votesTabHref]
  );

  if (stateError || proposalError) {
    return <FourZeroFour />;
  }

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
        <title>
          {proposal.attributes.title} - Proposal - Livepeer Explorer
        </title>
      </Head>
      <Container
        css={{ maxWidth: LAYOUT_MAX_WIDTH, marginTop: "$4", width: "100%" }}
      >
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
                  {proposerId?.name ?? formatAddress(proposal.proposer.id)}
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
              <HorizontalScrollContainer
                role="navigation"
                ariaLabel="Proposal navigation tabs"
              >
                {tabs.map((tab, i) => (
                  <NextLink
                    key={i}
                    href={tab.href}
                    passHref
                    legacyBehavior
                    scroll={false}
                  >
                    <A
                      variant="subtle"
                      data-active={tab.isActive ? "true" : undefined}
                      aria-current={tab.isActive ? "page" : undefined}
                      css={{
                        color: tab.isActive ? "$hiContrast" : "$neutral11",
                        marginRight: "$4",
                        fontSize: "$3",
                        fontWeight: 500,
                        flex: "0 0 auto",
                        whiteSpace: "nowrap",
                        "&:hover": {
                          textDecoration: "none",
                          color: "$hiContrast",
                        },
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        as="span"
                        css={{
                          display: "flex",
                          alignItems: "center",
                          minHeight: 33,
                          gap: "$1",
                          paddingBottom: "$2",
                          marginBottom: "-1px",
                          position: "relative",
                          zIndex: 2,
                          borderBottom: "3px solid",
                          borderColor: tab.isActive
                            ? "$primary11"
                            : "transparent",
                        }}
                      >
                        {tab.name}
                        {tab.count !== undefined && (
                          <Badge size="1" variant="green">
                            {tab.count}
                          </Badge>
                        )}
                      </Box>
                    </A>
                  </NextLink>
                ))}
              </HorizontalScrollContainer>
              <Box css={{ marginTop: "$4" }}>
                <Box css={{ display: view === "overview" ? "block" : "none" }}>
                  <Box
                    css={{
                      display: "grid",
                      gridGap: "$3",
                      gridTemplateColumns: "100%",
                      marginBottom: "$3",
                      "@bp2": {
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(128px, 1fr))",
                      },
                    }}
                  >
                    <Stat
                      css={{ flex: 1, mb: 0 }}
                      tooltip={`
                    Total Support = (For votes) ÷ (For votes + Against votes).
                    Abstentions are not included in the Total Support calculation.
                  `}
                      label={
                        <Box>
                          Total Support (
                          {formatPercent(
                            +proposal.quota / PERCENTAGE_PRECISION_MILLION
                          )}{" "}
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
                            <Flex css={{ alignItems: "center", gap: "$1" }}>
                              <Box
                                as={CheckCircledIcon}
                                css={{
                                  color: "$grass11",
                                  width: 14,
                                  height: 14,
                                }}
                              />
                              <Box css={{ color: "$grass11" }}>
                                For ({formatPercent(proposal.votes.percent.for)}
                                )
                              </Box>
                            </Flex>
                            <Box as="span">
                              {formatLPT(proposal.votes.total.for, {
                                precision: 4,
                              })}
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
                            <Flex css={{ alignItems: "center", gap: "$1" }}>
                              <Box
                                as={CrossCircledIcon}
                                css={{
                                  color: "$tomato11",
                                  width: 14,
                                  height: 14,
                                }}
                              />
                              <Box css={{ color: "$tomato11" }}>
                                Against (
                                {formatPercent(proposal.votes.percent.against)})
                              </Box>
                            </Flex>
                            <Box as="span">
                              {formatLPT(proposal.votes.total.against, {
                                precision: 4,
                              })}
                            </Box>
                          </Flex>
                          <Flex
                            css={{
                              fontSize: "$2",
                              justifyContent: "space-between",
                              color: "$hiContrast",
                            }}
                          >
                            <Flex css={{ alignItems: "center", gap: "$1" }}>
                              <Box
                                as={MinusCircledIcon}
                                css={{
                                  color: "$neutral11",
                                  width: 14,
                                  height: 14,
                                }}
                              />
                              <Box css={{ color: "$neutral11" }}>
                                Abstain (
                                {formatPercent(proposal.votes.percent.abstain)})
                              </Box>
                            </Flex>
                            <Box as="span">
                              {formatLPT(proposal.votes.total.abstain, {
                                precision: 4,
                              })}
                            </Box>
                          </Flex>
                        </Box>
                      }
                    />

                    <Stat
                      css={{ flex: 1, mb: 0 }}
                      tooltip={`
                    Total Participation = (For votes + Against votes + Abstain votes) ÷
                    (Voters + Nonvoters).
                  `}
                      label={
                        <Box>
                          Total Participation (
                          {formatPercent(
                            +proposal.quorum / +proposal.totalVoteSupply
                          )}{" "}
                          needed)
                        </Box>
                      }
                      value={
                        <Box>
                          {formatPercent(proposal.votes.percent.voters)}
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
                            <Box as="span" css={{ color: "$muted" }}>
                              Voters (
                              {formatPercent(proposal.votes.percent.voters)})
                            </Box>
                            <Box as="span">
                              <Box as="span">
                                {formatLPT(proposal.votes.total.voters, {
                                  precision: 4,
                                })}
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
                                {formatLPT(proposal.votes.total.nonVoters, {
                                  precision: 4,
                                })}
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
                            <Badge
                              css={{ marginBottom: "0.4em" }}
                              variant="green"
                              size="1"
                            >
                              LPT Transfer:
                            </Badge>
                            <Flex
                              css={{
                                paddingLeft: "$2",
                                marginBottom: "0.2em",
                              }}
                            >
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
                                    ? formatAddress(action.lptTransfer.receiver)
                                    : action.lptTransfer.receiver}
                                </Text>
                              </Link>
                            </Flex>
                            <Flex
                              css={{
                                paddingLeft: "$2",
                                marginBottom: "0.2em",
                              }}
                            >
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
                            <Badge
                              css={{ marginBottom: "0.4em" }}
                              variant="green"
                              size="1"
                            >
                              Custom:
                            </Badge>
                            <Flex
                              css={{
                                paddingLeft: "$2",
                                marginBottom: "0.2em",
                              }}
                            >
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
                                    ? `${
                                        action.contract?.name
                                      } (${formatAddress(action.target)})`
                                    : action.target}
                                </Text>
                              </Link>
                            </Flex>
                            <Flex
                              css={{
                                paddingLeft: "$2",
                                marginBottom: "0.2em",
                              }}
                            >
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
                              <Flex
                                css={{
                                  paddingLeft: "$2",
                                  marginBottom: "0.2em",
                                }}
                              >
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
                                <Flex
                                  css={{
                                    paddingLeft: "$2",
                                    marginBottom: "0.2em",
                                  }}
                                >
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
                        marginBottom: "$2",
                      }}
                    >
                      Description
                    </Heading>
                    <MarkdownRenderer>{proposal.description}</MarkdownRenderer>
                  </Card>
                </Box>
              </Box>
              <Box css={{ display: view === "votes" ? "block" : "none" }}>
                {votesContent()}
              </Box>
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
              <TreasuryVotingWidget
                proposal={proposal}
                vote={votingPower}
                votesTabHref={votesTabHref}
              />
            </Flex>
          ) : (
            <BottomDrawer>
              <TreasuryVotingWidget
                proposal={proposal}
                vote={votingPower}
                votesTabHref={votesTabHref}
              />
            </BottomDrawer>
          )}
        </Flex>
      </Container>
    </>
  );
};

Proposal.getLayout = getLayout;

export default Proposal;
