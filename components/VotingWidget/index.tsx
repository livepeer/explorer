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
import { Cross1Icon } from "@modulz/radix-icons";
import { useAccountAddress } from "hooks";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import Utils from "web3-utils";
import { abbreviateNumber } from "../../lib/utils";
import Check from "../../public/img/check.svg";
import Copy from "../../public/img/copy.svg";
import VoteButton from "../VoteButton";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

const Index = ({ data }) => {
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

  const noVoteStake = parseFloat(data.poll?.tally?.no || "0");
  const yesVoteStake = parseFloat(data.poll?.tally?.yes || "0");
  const totalVoteStake = noVoteStake + yesVoteStake;
  const totalNonVoteStake = +data?.poll?.totalNonVoteStake;
  const votingPower = getVotingPower(data?.myAccount, data?.vote);

  let delegate = null;
  if (data?.myAccount?.delegator?.delegate) {
    delegate = data?.myAccount?.delegator?.delegate;
  }

  return (
    <Box css={{ width: "100%" }}>
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
            Do you support LIP-{data.poll.lip}?
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
                  width: "100%",
                  height: 24,
                  mb: "8px",
                }}
              >
                <Box
                  css={{
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: 6,
                    borderTopRightRadius:
                      yesVoteStake / totalVoteStake === 1 ? 6 : 0,
                    borderBottomRightRadius:
                      yesVoteStake / totalVoteStake === 1 ? 6 : 0,
                    position: "absolute",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, .1)",
                    width: `${(yesVoteStake / totalVoteStake) * 100}%`,
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
                  Yes
                </Box>
                <Box
                  css={{
                    lineHeight: 1,
                    pr: "$2",
                    fontSize: "$2",
                  }}
                >
                  {isNaN(yesVoteStake / totalVoteStake)
                    ? 0
                    : ((yesVoteStake / totalVoteStake) * 100).toPrecision(5)}
                  %
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
                      noVoteStake / totalVoteStake === 1 ? 6 : 0,
                    borderBottomRightRadius:
                      noVoteStake / totalVoteStake === 1 ? 6 : 0,
                    position: "absolute",
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, .2)",
                    width: `${(noVoteStake / totalVoteStake) * 100}%`,
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
                  No
                </Box>
                <Box
                  css={{
                    lineHeight: 1,
                    pr: "$2",
                    fontSize: "$2",
                  }}
                >
                  {isNaN(noVoteStake / totalVoteStake)
                    ? 0
                    : ((noVoteStake / totalVoteStake) * 100).toPrecision(5)}
                  %
                </Box>
              </Flex>
            </Box>
            <Box css={{ fontSize: "$2", color: "$neutral11" }}>
              {data.poll.votes.length}{" "}
              {`${
                data.poll.votes.length > 1 || data.poll.votes.length === 0
                  ? "votes"
                  : "vote"
              }`}{" "}
              · {abbreviateNumber(totalVoteStake, 4)} LPT ·{" "}
              {!data.poll.isActive
                ? "Final Results"
                : dayjs
                    .duration(data.poll.estimatedTimeRemaining, "seconds")
                    .humanize() + " left"}
            </Box>
          </Box>

          {accountAddress ? (
            <>
              <Box>
                <Flex
                  css={{
                    fontSize: "$2",
                    mb: "$2",
                    justifyContent: "space-between",
                  }}
                >
                  <Box as="span" css={{ color: "$neutral11" }}>
                    My Delegate Vote{" "}
                    {delegate &&
                      `(${delegate.id.replace(delegate.id.slice(5, 39), "…")})`}
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
                    My Vote (
                    {accountAddress.replace(accountAddress.slice(5, 39), "…")})
                  </Box>
                  <Box
                    as="span"
                    css={{ fontWeight: 500, color: "$hiContrast" }}
                  >
                    {data?.vote?.choiceID ? data?.vote?.choiceID : "N/A"}
                  </Box>
                </Flex>
                {((!data?.vote?.choiceID && data.poll.isActive) ||
                  data?.vote?.choiceID) && (
                  <Flex
                    css={{ fontSize: "$2", justifyContent: "space-between" }}
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
                            (totalVoteStake + totalNonVoteStake)) *
                          100
                        ).toPrecision(2)}
                        %)
                      </Box>
                    </Box>
                  </Flex>
                )}
              </Box>
              {data.poll.isActive && renderVoteButton(data)}
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
      {data.poll.isActive && (
        <Box
          css={{
            display: "none",
            mt: "$3",
            fontSize: "$1",
            borderRadius: "$4",
            border: "1px solid $neutral4",
            p: "$3",
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
      <Dialog open={modalOpen}>
        <DialogContent>
          <Flex
            css={{
              justifyContent: "space-between",
              alignItems: "center",
              mb: "$4",
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

          <Box as="ol" css={{ pl: 15 }}>
            <Box as="li" css={{ mb: "$4" }}>
              <Box css={{ mb: "$3" }}>
                Run the Livepeer CLI and select the option to &quot;Vote on a
                poll&quot;. When prompted for a contract address, copy and paste
                this poll&apos;s contract address:
              </Box>
              <Box
                css={{
                  p: "$3",
                  mb: "$2",
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
                      ml: "$2",
                      mt: "3px",
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
            <Box as="li" css={{ mb: "$4" }}>
              <Box css={{ mb: "$3" }}>
                The Livepeer CLI will prompt you for your vote. Enter 0 to vote
                &quot;Yes&quot; or 1 to vote &quot;No&quot;.
              </Box>
            </Box>
            <Box as="li" css={{ mb: 0 }}>
              <Box css={{ mb: "$3" }}>
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

function renderVoteButton(data) {
  switch (data?.vote?.choiceID) {
    case "Yes":
      return (
        <VoteButton
          disabled={!(parseFloat(data?.myAccount?.delegator?.pendingStake) > 0)}
          css={{ mt: "$4", width: "100%" }}
          variant="red"
          size="4"
          choiceId={1}
          pollAddress={data.poll.id}
        >
          Change Vote To No
        </VoteButton>
      );
    case "No":
      return (
        <VoteButton
          disabled={!(parseFloat(data?.myAccount?.delegator?.pendingStake) > 0)}
          css={{ mt: "$4", width: "100%" }}
          size="4"
          variant="primary"
          choiceId={0}
          pollAddress={data.poll.id}
        >
          Change Vote To Yes
        </VoteButton>
      );
    default:
      return (
        <Box css={{ mt: "$4", display: "grid", gap: "$2", columns: 2 }}>
          <VoteButton
            disabled={
              !(parseFloat(data?.myAccount?.delegator?.pendingStake) > 0)
            }
            variant="primary"
            choiceId={0}
            size="4"
            pollAddress={data.poll.id}
          >
            Yes
          </VoteButton>
          <VoteButton
            disabled={
              !(parseFloat(data?.myAccount?.delegator?.pendingStake) > 0)
            }
            variant="red"
            size="4"
            choiceId={1}
            pollAddress={data.poll.id}
          >
            No
          </VoteButton>
        </Box>
      );
  }
}

function getVotingPower(myAccount, vote) {
  // if account is a delegate its voting power is its total stake minus its delegators' vote stake (nonVoteStake)
  if (myAccount?.account.id === myAccount?.delegator?.delegate.id) {
    if (vote?.voteStake) {
      return +vote.voteStake - +vote?.nonVoteStake;
    }
    return (
      +myAccount?.delegator?.delegate?.totalStake -
      (vote?.nonVoteStake ? +vote?.nonVoteStake : 0)
    );
  }

  return Utils.fromWei(
    myAccount?.delegator?.pendingStake
      ? myAccount?.delegator?.pendingStake
      : "0"
  );
}
