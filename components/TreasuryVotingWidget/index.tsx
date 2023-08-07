import { Box, Button, Flex, Heading, Text } from "@livepeer/design-system";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { useAccountAddress } from "hooks";
import numeral from "numeral";
import { useMemo } from "react";
import { abbreviateNumber } from "../../lib/utils";
import VoteButton from "../VoteButton";
import {
  Proposal,
  ProposalState,
  ProposalVotingPower,
} from "@lib/api/types/get-treasury-proposal";
import {
  ProposalVoteCounts,
  getProposalTextAttributes,
} from "@lib/api/treasury";

dayjs.extend(duration);

type Props = {
  proposal: Proposal;
  state: ProposalState;
  voteCounts: ProposalVoteCounts;
  vote: ProposalVotingPower | undefined | null;
};

const formatPercent = (percent: number) => numeral(percent).format("0.0000%");

const shortenAddress = (address: string) =>
  address?.replace(address.slice(5, 39), "…") ?? "";

const formatLPT = (lpt: string | undefined) =>
  abbreviateNumber(parseInt(lpt ?? "0") / 1e18, 4);

const TreasuryVotingWidget = ({
  proposal,
  state,
  voteCounts,
  vote,
  ...props
}: Props) => {
  const accountAddress = useAccountAddress();

  const attributes = useMemo(
    () => proposal && getProposalTextAttributes(proposal),
    [proposal]
  );

  return (
    <Box css={{ width: "100%" }} {...props}>
      <Box>
        <Box
          css={{
            width: "100%",
            border: "1px solid $neutral4",
            borderRadius: "$4",
            backgroundColor: "$panel",
            px: "$4",
            py: "$3",
          }}
        >
          <Heading size="1" css={{ fontWeight: "bold", mb: "$3" }}>
            Do you support{" "}
            {attributes?.lip ? `LIP-${attributes?.lip}` : "this proposal"}?
          </Heading>

          <Box
            css={{
              mb: "$3",
              pb: "$3",
              borderBottom: "1px solid $neutral4",
            }}
          >
            <Box css={{ mb: "$3" }}>
              <Flex
                css={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  height: 24,
                  width: "100%",
                  mb: "8px",
                }}
              >
                <Box
                  css={{
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: 6,
                    borderTopRightRadius:
                      voteCounts.percent.against === 1 ? 6 : 0,
                    borderBottomRightRadius:
                      voteCounts.percent.against === 1 ? 6 : 0,
                    position: "absolute",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, .1)",
                    width: `${voteCounts.percent.against * 100}%`,
                  }}
                />
                <Box
                  css={{
                    lineHeight: 1,
                    pl: "$2",
                    fontWeight: 500,
                    fontSize: "$2",
                  }}
                >
                  Against
                </Box>
                <Box
                  css={{
                    lineHeight: 1,
                    pr: "$2",
                    fontSize: "$2",
                  }}
                >
                  {formatPercent(voteCounts.percent.against)}
                </Box>
              </Flex>
              <Flex
                css={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  width: "100%",
                  height: 24,
                  mb: "8px",
                }}
              >
                <Box
                  css={{
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: 6,
                    borderTopRightRadius: voteCounts.percent.for === 1 ? 6 : 0,
                    borderBottomRightRadius:
                      voteCounts.percent.for === 1 ? 6 : 0,
                    position: "absolute",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, .2)",
                    width: `${voteCounts.percent.for * 100}%`,
                  }}
                />
                <Box
                  css={{
                    lineHeight: 1,
                    fontWeight: 500,
                    pl: "$2",
                    fontSize: "$2",
                  }}
                >
                  For
                </Box>
                <Box
                  css={{
                    lineHeight: 1,
                    pr: "$2",
                    fontSize: "$2",
                  }}
                >
                  {formatPercent(voteCounts.percent.for)}
                </Box>
              </Flex>
              <Flex
                css={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                  height: 24,
                  width: "100%",
                }}
              >
                <Box
                  css={{
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: 6,
                    borderTopRightRadius:
                      voteCounts.percent.abstain === 1 ? 6 : 0,
                    borderBottomRightRadius:
                      voteCounts.percent.abstain === 1 ? 6 : 0,
                    position: "absolute",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, .3)",
                    width: `${voteCounts.percent.abstain * 100}%`,
                  }}
                />
                <Box
                  css={{
                    lineHeight: 1,
                    pl: "$2",
                    fontWeight: 500,
                    fontSize: "$2",
                  }}
                >
                  Abstain
                </Box>
                <Box
                  css={{
                    lineHeight: 1,
                    pr: "$2",
                    fontSize: "$2",
                  }}
                >
                  {formatPercent(voteCounts.percent.abstain)}
                </Box>
              </Flex>
            </Box>
            <Box css={{ fontSize: "$2", color: "$neutral11" }}>
              {abbreviateNumber(voteCounts.total.voters, 4)} LPT voted ·{" "}
              {state.state !== "Pending" && state.state !== "Active"
                ? "Final Results"
                : dayjs
                    .duration(
                      dayjs().unix() - voteCounts.estimatedEndTime,
                      "seconds"
                    )
                    .humanize() + " left"}
            </Box>
          </Box>

          {accountAddress ? (
            <>
              <Box>
                {vote && !vote?.delegate ? null : (
                  <Flex
                    css={{
                      fontSize: "$2",
                      mb: "$2",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box as="span" css={{ color: "$neutral11" }}>
                      My Delegate{" "}
                      {vote?.delegate &&
                        `(${shortenAddress(vote?.delegate.address)})`}
                      {vote?.delegate &&
                        `: ${
                          vote.delegate.hasVoted
                            ? "already voted"
                            : "vote pending"
                        }`}
                    </Box>
                    <Box as="span" css={{ fontWeight: 500, color: "white" }}>
                      {vote?.delegate ? formatLPT(vote.delegate.votes) : "N/A"}
                    </Box>
                  </Flex>
                )}
                <Flex
                  css={{
                    fontSize: "$2",
                    justifyContent: "space-between",
                  }}
                >
                  <Box as="span" css={{ color: "$neutral11" }}>
                    My Vote (
                    {accountAddress.replace(accountAddress.slice(5, 39), "…")})
                    {vote?.self &&
                      `: ${
                        vote.self.hasVoted ? "already voted" : "vote pending"
                      }`}
                  </Box>
                  <Box
                    as="span"
                    css={{ fontWeight: 500, color: "$hiContrast" }}
                  >
                    {vote?.self ? formatLPT(vote.self.votes) : "N/A"}
                  </Box>
                </Flex>
                {!vote?.self.hasVoted && state.state === "Active" && (
                  <Flex
                    css={{
                      mt: "$2",
                      fontSize: "$2",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box as="span" css={{ color: "$muted" }}>
                      My Voting Power
                    </Box>
                    <Box
                      as="span"
                      css={{ fontWeight: 500, color: "$hiContrast" }}
                    >
                      <Box as="span">{formatLPT(vote?.self.votes)} LPT</Box>
                    </Box>
                  </Flex>
                )}
              </Box>
              {!proposal ||
              !vote ||
              state.state !== "Active" ||
              vote?.self.hasVoted ? null : (
                <Box css={{ mt: "$4", display: "grid", gap: "$2", columns: 2 }}>
                  <VoteButton
                    disabled={!(parseFloat(vote.self.votes) > 0)}
                    variant="red"
                    size="4"
                    choiceId={0}
                    proposalId={proposal?.id}
                  >
                    Against
                  </VoteButton>
                  <VoteButton
                    disabled={!(parseFloat(vote.self.votes) > 0)}
                    variant="primary"
                    choiceId={1}
                    size="4"
                    proposalId={proposal?.id}
                  >
                    For
                  </VoteButton>
                  <VoteButton
                    disabled={!(parseFloat(vote.self.votes) > 0)}
                    variant="gray"
                    size="4"
                    choiceId={2}
                    proposalId={proposal?.id}
                  >
                    Abstain
                  </VoteButton>
                </Box>
              )}
            </>
          ) : (
            <Flex align="center" direction="column">
              <Button
                size="4"
                disabled={true}
                variant="primary"
                css={{ width: "100%" }}
              >
                Vote
              </Button>
              <Text
                size="2"
                css={{ mt: "$1", fontWeight: 600, color: "$red11" }}
              >
                Connect your wallet to vote.
              </Text>
            </Flex>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default TreasuryVotingWidget;
