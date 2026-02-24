import QueueExecuteButton from "@components/QueueExecuteButton";
import VoteButton from "@components/VoteButton";
import { ProposalExtended } from "@lib/api/treasury";
import { ProposalVotingPower } from "@lib/api/types/get-treasury-proposal";
import dayjs from "@lib/dayjs";
import { Box, Button, Flex, Link as A, Text } from "@livepeer/design-system";
import {
  CheckCircledIcon,
  CrossCircledIcon,
  InfoCircledIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons";
import {
  formatLPT,
  formatNumber,
  formatPercent,
  formatVotingPower,
} from "@utils/numberFormatters";
import { formatAddress, fromWei } from "@utils/web3";
import { useAccountAddress } from "hooks";
import Link, { LinkProps } from "next/link";
import { useMemo, useState } from "react";
import { zeroAddress } from "viem";

import TreasuryVotingReason from "./TreasuryVotingReason";

type Props = {
  proposal: ProposalExtended;
  vote: ProposalVotingPower | undefined | null;
  votesTabHref?: LinkProps["href"] | string;
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <Text
    css={{
      fontSize: "$1",
      fontWeight: 700,
      color: "$neutral10",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      marginBottom: "$3",
    }}
  >
    {children}
  </Text>
);

const TreasuryVotingWidget = ({ proposal, vote, ...props }: Props) => {
  const accountAddress = useAccountAddress();

  const [reason, setReason] = useState("");

  const hasVotingPower =
    !!vote && !!vote.self && parseFloat(vote.self.votes) > 0;
  const canVoteNow =
    proposal.state === "Active" && vote?.self?.hasVoted === false;
  const isIneligible = canVoteNow && !hasVotingPower;
  const hasDelegate =
    !!vote?.delegate && vote.delegate.address.toLowerCase() !== zeroAddress;

  const userVoteStatus = useMemo(() => {
    if (!vote?.self) return null;
    if (isIneligible) return "Ineligible";
    if (vote.self.hasVoted) return "Voted";
    return "Not voted";
  }, [vote?.self, isIneligible]);

  return (
    <Box css={{ width: "100%" }} {...props}>
      <Box
        css={{
          width: "100%",
          border: "1px solid $neutral4",
          borderRadius: "$4",
          backgroundColor: "$panel",
          padding: "$4",
        }}
      >
        {/* ========== RESULTS SECTION ========== */}
        <Box css={{ marginBottom: "$4" }}>
          <SectionLabel>Results</SectionLabel>

          {/* Vote bars - read-only styled */}
          <Box css={{ marginBottom: "$3" }}>
            {/* For bar */}
            <Flex
              css={{
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "$2",
              }}
            >
              <Flex css={{ alignItems: "center", gap: "$1", minWidth: 60 }}>
                <Box
                  as={CheckCircledIcon}
                  css={{ color: "$grass11", width: 14, height: 14 }}
                />
                <Text css={{ fontSize: "$2", color: "$grass11" }}>For</Text>
              </Flex>
              <Flex
                css={{
                  flex: 1,
                  marginLeft: "$3",
                  marginRight: "$3",
                  alignItems: "center",
                }}
              >
                <Box
                  css={{
                    height: 8,
                    borderRadius: 1000,
                    backgroundColor: "$neutral5",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    css={{
                      height: "100%",
                      borderRadius: 1000,
                      backgroundColor: "$grass9",
                      width: `${proposal.votes.percent.for * 100}%`,
                    }}
                  />
                </Box>
              </Flex>
              <Text
                css={{
                  fontSize: "$2",
                  color: "$hiContrast",
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 55,
                  textAlign: "right",
                }}
              >
                {formatPercent(proposal.votes.percent.for)}
              </Text>
            </Flex>

            {/* Against bar */}
            <Flex
              css={{
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "$2",
              }}
            >
              <Flex css={{ alignItems: "center", gap: "$1", minWidth: 60 }}>
                <Box
                  as={CrossCircledIcon}
                  css={{ color: "$tomato11", width: 14, height: 14 }}
                />
                <Text css={{ fontSize: "$2", color: "$tomato11" }}>
                  Against
                </Text>
              </Flex>
              <Flex
                css={{
                  flex: 1,
                  marginLeft: "$3",
                  marginRight: "$3",
                  alignItems: "center",
                }}
              >
                <Box
                  css={{
                    height: 8,
                    borderRadius: 1000,
                    backgroundColor: "$neutral5",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    css={{
                      height: "100%",
                      borderRadius: 1000,
                      backgroundColor: "$tomato9",
                      width: `${proposal.votes.percent.against * 100}%`,
                    }}
                  />
                </Box>
              </Flex>
              <Text
                css={{
                  fontSize: "$2",
                  color: "$hiContrast",
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 55,
                  textAlign: "right",
                }}
              >
                {formatPercent(proposal.votes.percent.against)}
              </Text>
            </Flex>

            {/* Abstain bar */}
            <Flex
              css={{
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Flex css={{ alignItems: "center", gap: "$1", minWidth: 60 }}>
                <Box
                  as={MinusCircledIcon}
                  css={{ color: "$neutral11", width: 14, height: 14 }}
                />
                <Text css={{ fontSize: "$2", color: "$neutral11" }}>
                  Abstain
                </Text>
              </Flex>
              <Flex
                css={{
                  flex: 1,
                  marginLeft: "$3",
                  marginRight: "$3",
                  alignItems: "center",
                }}
              >
                <Box
                  css={{
                    height: 8,
                    borderRadius: 1000,
                    backgroundColor: "$neutral5",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    css={{
                      height: "100%",
                      borderRadius: 1000,
                      backgroundColor: "$neutral8",
                      width: `${proposal.votes.percent.abstain * 100}%`,
                    }}
                  />
                </Box>
              </Flex>
              <Text
                css={{
                  fontSize: "$2",
                  color: "$hiContrast",
                  fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                  minWidth: 55,
                  textAlign: "right",
                }}
              >
                {formatPercent(proposal.votes.percent.abstain)}
              </Text>
            </Flex>
          </Box>

          {/* Summary line */}
          <Flex css={{ alignItems: "center", justifyContent: "space-between" }}>
            <Text css={{ fontSize: "$2", color: "$neutral11" }}>
              {formatNumber(proposal.votes.total.voters, {
                precision: 0,
                abbreviate: true,
              })}{" "}
              voted ·{" "}
              {proposal.state !== "Pending" && proposal.state !== "Active"
                ? "Final Results"
                : dayjs.duration(proposal.votes.voteEndTime.diff()).humanize() +
                  " left"}
            </Text>
            {props.votesTabHref ? (
              <Link href={props.votesTabHref} passHref legacyBehavior>
                <A
                  css={{
                    fontSize: "$1",
                    color: "$primary11",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                    cursor: "pointer",
                  }}
                >
                  View votes
                </A>
              </Link>
            ) : (
              <A
                href="#votes-section"
                css={{
                  fontSize: "$1",
                  color: "$primary11",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                View votes
              </A>
            )}
          </Flex>
        </Box>

        {/* ========== YOUR VOTE SECTION ========== */}
        {accountAddress ? (
          <Box
            css={{
              borderTop: "1px solid $neutral4",
              paddingTop: "$4",
            }}
          >
            <SectionLabel>Your vote</SectionLabel>

            {/* Delegate vote status */}
            {hasDelegate && (
              <Flex
                css={{
                  fontSize: "$2",
                  marginBottom: "$3",
                  justifyContent: "space-between",
                }}
              >
                <Text css={{ color: "$neutral11" }}>
                  Delegate vote ({formatAddress(vote.delegate!.address)})
                </Text>
                <Text css={{ fontWeight: 500, color: "$hiContrast" }}>
                  {vote.delegate!.hasVoted ? "Voted" : "Not voted"}
                </Text>
              </Flex>
            )}

            {/* User vote status */}
            <Flex
              css={{
                fontSize: "$2",
                marginBottom: "$3",
                justifyContent: "space-between",
              }}
            >
              <Text css={{ color: "$neutral11" }}>Status</Text>
              <Text
                css={{
                  fontWeight: 500,
                  color: isIneligible ? "$neutral11" : "$hiContrast",
                }}
              >
                {userVoteStatus}
              </Text>
            </Flex>

            {/* Voting power */}
            <Flex
              css={{
                fontSize: "$2",
                justifyContent: "space-between",
                marginBottom: "$4",
              }}
            >
              <Text css={{ color: "$neutral11" }}>Voting power</Text>
              <Text
                css={{
                  fontWeight: 500,
                  color: isIneligible ? "$neutral11" : "$hiContrast",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatVotingPower(fromWei(vote?.self?.votes))}
              </Text>
            </Flex>

            {/* ========== ACTION AREA ========== */}

            {/* Eligible: show vote buttons + reason */}
            {canVoteNow && hasVotingPower && (
              <Box
                css={{
                  marginTop: "$4",
                  display: "grid",
                  gap: "$3",
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <VoteButton
                  choiceId={1}
                  size="4"
                  proposalId={proposal?.id}
                  reason={reason}
                  css={{
                    backgroundColor: "$grass3",
                    color: "$grass11",
                    fontWeight: 600,
                    border: "1px solid $grass4",
                    "&:hover": {
                      backgroundColor: "$grass4",
                      borderColor: "$grass5",
                    },
                  }}
                >
                  <Flex css={{ alignItems: "center", gap: "$2" }}>
                    <Box as={CheckCircledIcon} />
                    For
                  </Flex>
                </VoteButton>
                <VoteButton
                  size="4"
                  choiceId={0}
                  proposalId={proposal?.id}
                  reason={reason}
                  css={{
                    backgroundColor: "$tomato3",
                    color: "$tomato11",
                    fontWeight: 600,
                    border: "1px solid $tomato4",
                    "&:hover": {
                      backgroundColor: "$tomato4",
                      borderColor: "$tomato5",
                    },
                  }}
                >
                  <Flex css={{ alignItems: "center", gap: "$2" }}>
                    <Box as={CrossCircledIcon} />
                    Against
                  </Flex>
                </VoteButton>
                <VoteButton
                  size="4"
                  choiceId={2}
                  proposalId={proposal?.id}
                  reason={reason}
                  css={{
                    gridColumn: "span 2",
                    backgroundColor: "$neutral3",
                    color: "$neutral11",
                    fontWeight: 600,
                    border: "1px solid $neutral4",
                    "&:hover": {
                      backgroundColor: "$neutral4",
                      borderColor: "$neutral5",
                    },
                  }}
                >
                  <Flex css={{ alignItems: "center", gap: "$2" }}>
                    <Box as={MinusCircledIcon} />
                    Abstain
                  </Flex>
                </VoteButton>

                <Box css={{ gridColumn: "span 2" }}>
                  <TreasuryVotingReason reason={reason} setReason={setReason} />
                </Box>
              </Box>
            )}

            {/* Ineligible: show info banner + links, no buttons, no reason */}
            {isIneligible && (
              <Box
                css={{
                  marginTop: "$4",
                  padding: "$3",
                  borderRadius: "$3",
                  backgroundColor: "$neutral3",
                  border: "1px solid $neutral5",
                }}
              >
                <Flex css={{ alignItems: "flex-start", gap: "$2" }}>
                  <Box
                    as={InfoCircledIcon}
                    css={{
                      color: "$neutral11",
                      flexShrink: 0,
                      width: 16,
                      height: 16,
                      marginTop: 1,
                    }}
                  />
                  <Box>
                    <Text
                      css={{
                        fontSize: "$2",
                        fontWeight: 600,
                        color: "$hiContrast",
                        marginBottom: "$1",
                      }}
                    >
                      Ineligible to vote
                    </Text>
                    <Text
                      css={{
                        fontSize: "$2",
                        color: "$neutral11",
                        marginBottom: "$3",
                      }}
                    >
                      You had {formatLPT(0)} staked on{" "}
                      {proposal.votes.voteStartTime.format("MMM D, YYYY")} when
                      this proposal was created.
                    </Text>
                    <Flex css={{ gap: "$3" }}>
                      <A
                        href="https://github.com/livepeer/LIPs/blob/master/LIPs/LIP-89.md#governance-over-the-treasury"
                        target="_blank"
                        rel="noopener noreferrer"
                        css={{
                          fontSize: "$2",
                          color: "$primary11",
                          textDecoration: "none",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        Learn about stake snapshots
                      </A>
                    </Flex>
                  </Box>
                </Flex>
              </Box>
            )}

            {/* Queue/Execute buttons for passed proposals */}
            {["Succeeded", "Queued"].includes(proposal?.state) && (
              <Box
                css={{
                  marginTop: "$4",
                }}
              >
                <QueueExecuteButton
                  variant="primary"
                  size="4"
                  action={proposal.state === "Queued" ? "execute" : "queue"}
                  proposal={proposal}
                  css={{ width: "100%" }}
                />
              </Box>
            )}
          </Box>
        ) : (
          /* No wallet connected */
          <Box
            css={{
              borderTop: "1px solid $neutral4",
              paddingTop: "$4",
            }}
          >
            <SectionLabel>Your vote</SectionLabel>
            <Flex align="center" direction="column">
              <Button
                size="4"
                disabled={true}
                variant="primary"
                css={{ width: "100%" }}
              >
                Vote
              </Button>
              <Text size="2" css={{ marginTop: "$2", color: "$neutral11" }}>
                Connect your wallet to vote.
              </Text>
            </Flex>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default TreasuryVotingWidget;
