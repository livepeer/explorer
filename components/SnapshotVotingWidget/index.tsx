import { Box, Button, Flex, Heading, Text } from "@livepeer/design-system";
import dayjs from "@lib/dayjs";
import { useAccountAddress, useSnapshotHasVoted, useSnapshotVotingPower } from "hooks";
import numeral from "numeral";
import { useState } from "react";
import { abbreviateNumber } from "@lib/utils";
import SnapshotVoteButton from "@components/SnapshotVoteButton";
import { SnapshotProposal } from "@lib/api/snapshot";
import TreasuryVotingReason from "@components/TreasuryVotingReason";

type Props = {
  proposal: SnapshotProposal;
};

const formatPercent = (percent: number) => numeral(percent).format("0.0000%");

const SnapshotVotingWidget = ({ proposal, ...props }: Props) => {
  const accountAddress = useAccountAddress();
  const endDate = dayjs.unix(proposal.end);
  const now = dayjs();
  const isActive = proposal.state === "active";

  const { data: votingPower } = useSnapshotVotingPower(
    accountAddress,
    proposal.id,
    proposal.snapshot,
    proposal.strategies
  );
  
  const { data: hasVoted } = useSnapshotHasVoted(accountAddress, proposal.id);

  const [reason, setReason] = useState("");

  // Calculate vote percentages
  const totalVotes = proposal.scores_total || 0;
  const choicePercentages = proposal.scores?.map((score) =>
    totalVotes > 0 ? score / totalVotes : 0
  ) || [];

  return (
    <Box css={{ width: "100%" }} {...props}>
      <Box>
        <Box
          css={{
            width: "100%",
            border: "1px solid $neutral4",
            borderRadius: "$4",
            backgroundColor: "$panel",
            paddingLeft: "$4",
            paddingRight: "$4",
            paddingTop: "$3",
            paddingBottom: "$3",
          }}
        >
          <Heading size="1" css={{ fontWeight: "bold", mb: "$3" }}>
            Do you support this proposal?
          </Heading>

          <Box
            css={{
              marginBottom: "$3",
              paddingBottom: "$3",
              borderBottom: "1px solid $neutral4",
            }}
          >
            <Box css={{ marginBottom: "$3" }}>
              {proposal.choices.map((choice, index) => (
                <Flex
                  key={index}
                  css={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                    height: 24,
                    width: "100%",
                    marginBottom: "8px",
                  }}
                >
                  <Box
                    css={{
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                      borderTopRightRadius:
                        choicePercentages[index] === 1 ? 6 : 0,
                      borderBottomRightRadius:
                        choicePercentages[index] === 1 ? 6 : 0,
                      position: "absolute",
                      height: "100%",
                      backgroundColor: `rgba(255, 255, 255, ${0.1 + index * 0.1})`,
                      width: `${(choicePercentages[index] || 0) * 100}%`,
                    }}
                  />
                  <Box
                    css={{
                      lineHeight: 1,
                      paddingLeft: "$2",
                      fontWeight: 500,
                      fontSize: "$2",
                    }}
                  >
                    {choice}
                  </Box>
                  <Box
                    css={{
                      lineHeight: 1,
                      paddingRight: "$2",
                      fontSize: "$2",
                    }}
                  >
                    {formatPercent(choicePercentages[index] || 0)}
                  </Box>
                </Flex>
              ))}
            </Box>
            <Box css={{ fontSize: "$2", color: "$neutral11" }}>
              {abbreviateNumber(totalVotes, 4)} votes ·{" "}
              {!isActive
                ? "Final Results"
                : dayjs.duration(endDate.diff(now)).humanize() + " left"}
            </Box>
          </Box>

          {accountAddress ? (
            <>
              <Box>
                <Flex
                  css={{
                    fontSize: "$2",
                    justifyContent: "space-between",
                  }}
                >
                  <Box as="span" css={{ color: "$neutral11" }}>
                    You (
                    {accountAddress.replace(accountAddress.slice(5, 39), "…")})
                    {hasVoted ? " already voted" : " haven't voted yet"}
                  </Box>
                  <Box
                    as="span"
                    css={{ fontWeight: 500, color: "$hiContrast" }}
                  >
                    {votingPower > 0 ? abbreviateNumber(votingPower, 4) : "0"} VP
                  </Box>
                </Flex>
                {!hasVoted && isActive && (
                  <Flex
                    css={{
                      marginTop: "$2",
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
                      <Box as="span">{abbreviateNumber(votingPower, 4)} VP</Box>
                    </Box>
                  </Flex>
                )}
              </Box>

              {isActive && !hasVoted && (
                <Box
                  css={{
                    marginTop: "$4",
                    display: "grid",
                    gap: "$2",
                    columns: 2,
                  }}
                >
                  {proposal.choices.map((choice, index) => (
                    <SnapshotVoteButton
                      key={index}
                      disabled={votingPower <= 0}
                      variant={index === 0 ? "red" : index === 1 ? "primary" : "gray"}
                      size="4"
                      choice={index + 1}
                      proposalId={proposal.id}
                      reason={reason}
                    >
                      {choice}
                    </SnapshotVoteButton>
                  ))}

                  <TreasuryVotingReason
                    reason={reason}
                    setReason={setReason}
                    disabled={votingPower <= 0}
                  />
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
                css={{ marginTop: "$1", fontWeight: 600, color: "$red11" }}
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

export default SnapshotVotingWidget;
