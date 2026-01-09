import { PollExtended } from "@lib/api/polls";
import dayjs from "@lib/dayjs";
import { abbreviateNumber, formatAddress, fromWei } from "@lib/utils";
import {
  Box,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  Flex,
  Heading,
  Text,
  useSnackbar,
} from "@livepeer/design-system";
import {
  CheckCircledIcon,
  Cross1Icon,
  CrossCircledIcon,
} from "@radix-ui/react-icons";
import { AccountQuery, PollChoice, TranscoderStatus } from "apollo";
import { useAccountAddress, usePendingFeesAndStakeData } from "hooks";
import numbro from "numbro";
import { useEffect, useMemo, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import Check from "../../../public/img/check.svg";
import Copy from "../../../public/img/copy.svg";
import VoteButton from "../VoteButton";

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

const formatPercent = (percent: number) =>
  numbro(percent).format({
    output: "percent",
    mantissa: 2,
  });

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
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [openSnackbar] = useSnackbar();

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 5000);
    }
  }, [copied]);

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
                <Text css={{ fontSize: "$2", color: "$neutral11" }}>For</Text>
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
                    borderRadius: 4,
                    backgroundColor: "$neutral5",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    css={{
                      height: "100%",
                      borderRadius: 4,
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
                <Text css={{ fontSize: "$2", color: "$neutral11" }}>
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
                    borderRadius: 4,
                    backgroundColor: "$neutral5",
                    width: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    css={{
                      height: "100%",
                      borderRadius: 4,
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
            · {abbreviateNumber(data.poll.stake.voters, 4)} LPT ·{" "}
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
                    ? data?.delegateVote?.choiceID
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
                  {data?.vote?.choiceID ? data?.vote?.choiceID : "N/A"}
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
                      {abbreviateNumber(votingPower, 4)} LPT (
                      {(
                        (+votingPower /
                          (data.poll.stake.nonVoters +
                            data.poll.stake.voters)) *
                        100
                      ).toPrecision(2)}
                      %)
                    </Box>
                  </Box>
                </Flex>
              )}
            </Box>
            {data.poll.status === "active" &&
              data &&
              renderVoteButton(
                data?.myAccount,
                data?.vote,
                data?.poll,
                pendingFeesAndStake?.pendingStake ?? ""
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
        <Box
          css={{
            display: "none",
            marginTop: "$3",
            fontSize: "$1",
            borderRadius: "$4",
            border: "1px solid $neutral4",
            padding: "$3",
            "@bp3": {
              display: "block",
            },
          }}
        >
          <Box css={{ lineHeight: 1.8 }}>
            Are you an orchestrator?{" "}
            <Box
              as="span"
              onClick={() => setModalOpen(true)}
              css={{ color: "$primary11", cursor: "pointer" }}
            >
              Follow these instructions
            </Box>{" "}
            if you prefer to vote with the Livepeer CLI.
          </Box>
        </Box>
      )}
      <Dialog onOpenChange={setModalOpen} open={modalOpen}>
        <DialogContent
          onPointerEnterCapture={undefined}
          onPointerLeaveCapture={undefined}
          placeholder={undefined}
        >
          <Flex
            css={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "$4",
            }}
          >
            <DialogTitle asChild>
              <Heading size="1" css={{ fontWeight: 700, width: "100%" }}>
                Livepeer CLI Voting Instructions
              </Heading>
            </DialogTitle>
            <DialogClose asChild>
              <Box
                as={Cross1Icon}
                css={{
                  alignSelf: "flex-start",
                  cursor: "pointer",
                  color: "$white",
                  width: 16,
                  height: 16,
                }}
              />
            </DialogClose>
          </Flex>

          <Box as="ol" css={{ paddingLeft: 15 }}>
            <Box as="li" css={{ marginBottom: "$4" }}>
              <Box css={{ marginBottom: "$3" }}>
                Run the Livepeer CLI and select the option to &quot;Vote on a
                poll&quot;. When prompted for a contract address, copy and paste
                this poll&apos;s contract address:
              </Box>
              <Box
                css={{
                  padding: "$3",
                  marginBottom: "$2",
                  position: "relative",
                  color: "$primary11",
                  backgroundColor: "$primary4",
                  borderRadius: "$4",
                  fontWeight: 500,
                }}
              >
                {data.poll.id}
                <CopyToClipboard
                  text={data.poll.id}
                  onCopy={() => {
                    setCopied(true);
                    openSnackbar("Copied to clipboard");
                  }}
                >
                  <Flex
                    css={{
                      marginLeft: "$2",
                      marginTop: "3px",
                      position: "absolute",
                      right: 12,
                      top: 10,
                      cursor: "pointer",
                      borderRadius: 1000,
                      width: 26,
                      height: 26,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {copied ? (
                      <Check
                        css={{
                          width: 12,
                          height: 12,
                        }}
                      />
                    ) : (
                      <Copy
                        css={{
                          width: 12,
                          height: 12,
                        }}
                      />
                    )}
                  </Flex>
                </CopyToClipboard>
              </Box>
            </Box>
            <Box as="li" css={{ marginBottom: "$4" }}>
              <Box css={{ marginBottom: "$3" }}>
                The Livepeer CLI will prompt you for your vote. Enter 0 to vote
                &quot;For&quot; or 1 to vote &quot;Against&quot;.
              </Box>
            </Box>
            <Box as="li" css={{ marginBottom: 0 }}>
              <Box css={{ marginBottom: "$3" }}>
                Once your vote is confirmed, check back here to see it reflected
                in the UI.
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Index;

function renderVoteButton(
  myAccount: Props["myAccount"],
  vote: Props["vote"],
  poll: Props["poll"],
  pendingStake: string
) {
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

function getVotingPower(
  accountAddress: string,
  myAccount: Props["myAccount"],
  vote: Props["vote"],
  pendingStake?: string
) {
  // if account is a delegate its voting power is its total stake minus its delegators' vote stake (nonVoteStake)
  if (accountAddress === myAccount?.delegator?.delegate?.id) {
    if (vote?.voteStake) {
      return +vote.voteStake - +vote?.nonVoteStake;
    }
    return (
      +myAccount?.delegator?.delegate?.totalStake -
      (vote?.nonVoteStake ? +vote?.nonVoteStake : 0)
    );
  }

  return fromWei(pendingStake ? pendingStake : "0");
}
