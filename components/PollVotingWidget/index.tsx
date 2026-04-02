import CliVotingInstructionsDialog from "@components/CliVotingInstructionsDialog";
import VoteButton from "@components/VoteButton";
import { PollExtended } from "@lib/api/polls";
import dayjs from "@lib/dayjs";
import { Box, Button, Flex, Heading, Text } from "@livepeer/design-system";
import { CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { formatPercent, formatVotingPower } from "@utils/numberFormatters";
import { formatAddress } from "@utils/web3";
import { AccountQuery, PollChoice, TranscoderStatus } from "apollo";
import { useAccountAddress, usePendingFeesAndStakeData } from "hooks";
import { useMemo } from "react";
import { getVotingPower } from "utils/voting";

type Props = {
  poll: PollExtended;
  delegateVote:
    | {
        __typename: "Vote";
        choiceID?: PollChoice;
        voteStake: string;
        nonVoteStake: string;
      }
    | undefined
    | null;
  vote:
    | {
        __typename: "Vote";
        choiceID?: PollChoice;
        voteStake: string;
        nonVoteStake: string;
      }
    | undefined
    | null;
  myAccount: AccountQuery;
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
      display: "block",
    }}
  >
    {children}
  </Text>
);

const Index = ({ data }: { data: Props }) => {
  const accountAddress = useAccountAddress();

  const pendingFeesAndStake = usePendingFeesAndStakeData(
    data?.myAccount?.delegator?.id
  );

  const votingPower = useMemo(
    () =>
      getVotingPower(
        accountAddress ?? "",
        data?.myAccount,
        data?.vote,
        pendingFeesAndStake?.pendingStake
          ? pendingFeesAndStake?.pendingStake
          : "0"
      ),
    [accountAddress, data, pendingFeesAndStake]
  );

  let delegate: {
    __typename: "Transcoder";
    id: string;
    active: boolean;
    status: TranscoderStatus;
    totalStake: string;
  } | null = null;

  if (data?.myAccount?.delegator?.delegate) {
    delegate = data?.myAccount?.delegator?.delegate;
  }

  return (
    <Box css={{ width: "100%" }}>
      <Box
        css={{
          width: "100%",
          border: "1px solid $neutral4",
          borderRadius: "$4",
          backgroundColor: "$panel",
          padding: "$4",
        }}
      >
        <Heading size="1" css={{ fontWeight: "bold", marginBottom: "$4" }}>
          Do you support LIP-{data?.poll?.attributes?.lip ?? "ERR"}?
        </Heading>

        {/* ========== RESULTS SECTION ========== */}
        <Box css={{ marginBottom: "$4" }}>
          <SectionLabel>Results</SectionLabel>

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
                      width: `${data.poll.percent.yes * 100}%`,
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
                {formatPercent(data.poll.percent.yes)}
              </Text>
            </Flex>

            {/* Against bar */}
            <Flex
              css={{
                alignItems: "center",
                justifyContent: "space-between",
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
                      width: `${data.poll.percent.no * 100}%`,
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
                {formatPercent(data.poll.percent.no)}
              </Text>
            </Flex>
          </Box>

          <Box css={{ fontSize: "$2", color: "$neutral11" }}>
            {data.poll.votes.length}{" "}
            {`${
              data.poll.votes.length > 1 || data.poll.votes.length === 0
                ? "votes"
                : "vote"
            }`}{" "}
            · {formatVotingPower(data.poll.stake.voters)} ·{" "}
            {data.poll.status !== "active"
              ? "Final Results"
              : dayjs
                  .duration(
                    dayjs().unix() - data.poll.estimatedEndTime,
                    "seconds"
                  )
                  .humanize() + " left"}
          </Box>
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
            <Box>
              <Flex
                css={{
                  fontSize: "$2",
                  marginBottom: "$2",
                  justifyContent: "space-between",
                }}
              >
                <Box as="span" css={{ color: "$neutral11" }}>
                  My Delegate Vote{" "}
                  {delegate && `(${formatAddress(delegate?.id)})`}
                </Box>
                <Box as="span" css={{ fontWeight: 500, color: "white" }}>
                  {data?.delegateVote?.choiceID
                    ? data?.delegateVote?.choiceID === "Yes"
                      ? "For"
                      : "Against"
                    : "N/A"}
                </Box>
              </Flex>
              <Flex
                css={{
                  fontSize: "$2",
                  justifyContent: "space-between",
                }}
              >
                <Box as="span" css={{ color: "$neutral11" }}>
                  My Vote ({formatAddress(accountAddress)})
                </Box>
                <Box as="span" css={{ fontWeight: 500, color: "$hiContrast" }}>
                  {data?.vote?.choiceID
                    ? data?.vote?.choiceID === "Yes"
                      ? "For"
                      : "Against"
                    : "N/A"}
                </Box>
              </Flex>
              {((!data?.vote?.choiceID && data.poll.status === "active") ||
                data?.vote?.choiceID) && (
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
                    <Box as="span">
                      {formatVotingPower(votingPower)} (
                      {formatPercent(
                        +votingPower /
                          (data.poll.stake.nonVoters + data.poll.stake.voters)
                      )}
                      )
                    </Box>
                  </Box>
                </Flex>
              )}
            </Box>
            {data.poll.status === "active" && (
              <PollVoteButton
                vote={data.vote}
                poll={data.poll}
                pendingStake={pendingFeesAndStake?.pendingStake ?? ""}
              />
            )}
          </Box>
        ) : (
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

      {data.poll.status === "active" && (
        <CliVotingInstructionsDialog
          voteId={data.poll.id}
          idLabel="poll's contract address"
          cliOptionName="Vote on a poll"
          voteInstructions='Enter 0 to vote "For" or 1 to vote "Against".'
        />
      )}
    </Box>
  );
};

export default Index;

function PollVoteButton({
  vote,
  poll,
  pendingStake,
}: {
  vote: Props["vote"];
  poll: Props["poll"];
  pendingStake: string;
}) {
  switch (vote?.choiceID) {
    case "Yes":
      return (
        <VoteButton
          disabled={!(parseFloat(pendingStake) > 0)}
          css={{
            marginTop: "$4",
            width: "100%",
            backgroundColor: "$tomato3",
            color: "$tomato11",
            fontWeight: 600,
            border: "1px solid $tomato4",
            "&:hover": {
              backgroundColor: "$tomato4",
              borderColor: "$tomato5",
            },
          }}
          size="4"
          choiceId={1}
          pollAddress={poll?.id}
        >
          <Flex
            css={{ alignItems: "center", gap: "$2", justifyContent: "center" }}
          >
            <Box as={CrossCircledIcon} />
            Change Vote To Against
          </Flex>
        </VoteButton>
      );
    case "No":
      return (
        <VoteButton
          disabled={!(parseFloat(pendingStake) > 0)}
          css={{
            marginTop: "$4",
            width: "100%",
            backgroundColor: "$grass3",
            color: "$grass11",
            fontWeight: 600,
            border: "1px solid $grass4",
            "&:hover": {
              backgroundColor: "$grass4",
              borderColor: "$grass5",
            },
          }}
          size="4"
          choiceId={0}
          pollAddress={poll?.id}
        >
          <Flex
            css={{ alignItems: "center", gap: "$2", justifyContent: "center" }}
          >
            <Box as={CheckCircledIcon} />
            Change Vote To For
          </Flex>
        </VoteButton>
      );
    default:
      return (
        <Box css={{ marginTop: "$4", display: "grid", gap: "$2", columns: 2 }}>
          <VoteButton
            disabled={!(parseFloat(pendingStake) > 0)}
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
            choiceId={0}
            size="4"
            pollAddress={poll?.id}
          >
            <Flex
              css={{
                alignItems: "center",
                gap: "$2",
                justifyContent: "center",
              }}
            >
              <Box as={CheckCircledIcon} />
              For
            </Flex>
          </VoteButton>
          <VoteButton
            disabled={!(parseFloat(pendingStake) > 0)}
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
            size="4"
            choiceId={1}
            pollAddress={poll?.id}
          >
            <Flex
              css={{
                alignItems: "center",
                gap: "$2",
                justifyContent: "center",
              }}
            >
              <Box as={CrossCircledIcon} />
              Against
            </Flex>
          </VoteButton>
        </Box>
      );
  }
}
