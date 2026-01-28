import Spinner from "@components/Spinner";
import { Fm } from "@lib/api/polls";
import { parseProposalText, Proposal } from "@lib/api/treasury";
import { POLL_VOTES, VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import dayjs from "@lib/dayjs";
import { formatAddress, formatTransactionHash } from "@lib/utils";
import {
  Badge,
  Box,
  Card as CardBase,
  Flex,
  Link as A,
  styled,
} from "@livepeer/design-system";
import { ExternalLinkIcon } from "@modulz/radix-icons";
import {
  TreasuryVoteEvent,
  TreasuryVoteSupport,
  useTransactionsQuery,
  VoteEvent,
} from "apollo";
import fm from "front-matter";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useRouter } from "next/router";
import numbro from "numbro";
import { useEffect, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";

const Card = styled(CardBase, {
  length: {},
  border: "1px solid $neutral3",
  mb: "$2",
  p: "$4",
});

const Index = () => {
  const router = useRouter();
  const query = router.query;
  const account = query.account as string;

  const {
    data,
    loading,
    error,
    fetchMore: fetchMoreTransactions,
    stopPolling,
  } = useTransactionsQuery({
    variables: {
      account: account.toLowerCase(),
      first: 10,
      skip: 0,
    },
    notifyOnNetworkStatusChange: true,
  });

  const events = useMemo(() => {
    // First reverse the order of the array of events per transaction to have events in descending order
    const reversedEvents = data?.transactions?.map((tx) => {
      return {
        ...tx,
        events: tx.events ? tx.events.slice().reverse() : [],
      };
    });
    return reversedEvents?.flatMap(({ events: e }) => e ?? []) ?? [];
  }, [data]);

  const lastEventTimestamp = useMemo(
    () =>
      Number(events?.[(events?.length || 0) - 1]?.transaction?.timestamp ?? 0),
    [events]
  );

  const [extendedVoteEventsData, setExtendedVoteEventsData] = useState<
    (VoteEvent & { attributes: Fm | null })[]
  >([]);
  useEffect(() => {
    const getExtendedVoteEventsData = async () => {
      const newVoteEvents = events
        .filter((e) => e.__typename === "VoteEvent")
        .filter((e) => !extendedVoteEventsData.find((ve) => ve.id === e.id));
      const newExtendedVoteEventsData = await Promise.all(
        newVoteEvents.map(async (voteEvent) => {
          const ipfsObject = await catIpfsJson<IpfsPoll>(
            voteEvent.poll?.proposal
          );
          let attributes: Fm | null = null;

          // only include proposals with valid format
          if (ipfsObject?.text && ipfsObject?.gitCommitHash) {
            const transformedProposal = fm<Fm>(ipfsObject.text);

            attributes = {
              title: String(transformedProposal.attributes.title),
              lip: String(transformedProposal.attributes.lip),
              commitHash: String(ipfsObject.gitCommitHash),
              created: String(transformedProposal.attributes.created),
              text: String(transformedProposal.body),
            };
          }
          return {
            ...voteEvent,
            attributes,
          };
        }) || []
      );
      setExtendedVoteEventsData(
        (current) =>
          [...current, ...newExtendedVoteEventsData] as (VoteEvent & {
            attributes: Fm | null;
          })[]
      );
    };
    getExtendedVoteEventsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const [extendedTreasuryVoteEventsData, setExtendedTreasuryVoteEventsData] =
    useState<(TreasuryVoteEvent & { attributes: Fm | null })[]>([]);
  useEffect(() => {
    const newTreasuryVoteEvents = events
      .filter((e) => e.__typename === "TreasuryVoteEvent")
      .filter(
        (e) => !extendedTreasuryVoteEventsData.find((te) => te.id === e.id)
      );
    const newExtendedTreasureVoteEventsData = newTreasuryVoteEvents
      .filter((e) => e.__typename === "TreasuryVoteEvent")
      .map((treasuryVoteEvent) => {
        const parsed = parseProposalText(
          treasuryVoteEvent.proposal as Proposal
        );
        return {
          ...treasuryVoteEvent,
          attributes: parsed.attributes,
        };
      });
    setExtendedTreasuryVoteEventsData(
      (current) =>
        [
          ...current,
          ...newExtendedTreasureVoteEventsData,
        ] as (TreasuryVoteEvent & { attributes: Fm | null })[]
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  // performs filtering of winning ticket redeemed events and merges with separate "winning tickets"
  // this is so Os winning tickets show properly: https://github.com/livepeer/explorer/issues/108
  const mergedEvents = useMemo(
    () =>
      [
        ...events.filter(
          (e) =>
            e?.__typename !== "WinningTicketRedeemedEvent" &&
            e?.__typename !== "TreasuryVoteEvent" &&
            e?.__typename !== "VoteEvent"
        ),
        ...(data?.winningTicketRedeemedEvents?.filter(
          (e) => (e?.transaction?.timestamp ?? 0) > lastEventTimestamp
        ) ?? []),
        ...extendedTreasuryVoteEventsData.filter(
          (e) => (e?.transaction?.timestamp ?? 0) > lastEventTimestamp
        ),
        ...extendedVoteEventsData.filter(
          (e) => (e?.transaction?.timestamp ?? 0) > lastEventTimestamp
        ),
      ].sort(
        (a, b) =>
          (b?.transaction?.timestamp ?? 0) - (a?.transaction?.timestamp ?? 0)
      ),
    [
      events,
      data,
      lastEventTimestamp,
      extendedTreasuryVoteEventsData,
      extendedVoteEventsData,
    ]
  );

  if (error) {
    console.error(error);
  }

  if (loading && !data) {
    return (
      <Flex
        css={{
          paddingTop: "$5",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner />
      </Flex>
    );
  }

  if (!data?.transactions?.length) {
    return <Box css={{ paddingTop: "$3" }}>No history</Box>;
  }

  return (
    <InfiniteScroll
      css={{ overflow: "hidden !important" }}
      scrollThreshold={0.5}
      dataLength={data && data.transactions.length}
      next={async () => {
        stopPolling();
        if (!loading && data.transactions.length >= 10) {
          try {
            await fetchMoreTransactions({
              variables: {
                skip: data.transactions.length,
              },
              updateQuery: (previousResult, { fetchMoreResult }) => {
                if (!fetchMoreResult) {
                  return previousResult;
                }

                return {
                  ...previousResult,
                  transactions: [
                    ...previousResult.transactions,
                    ...fetchMoreResult.transactions,
                  ],
                  // Basing the query skip for winning tickets on transactions.length is fine because there will always be more transactions than winning tickets
                  // So, we will always have winning ticket events that are older than the last transaction timestamp
                  // Allowing mergedEvents to filter correctly
                  winningTicketRedeemedEvents: [
                    ...previousResult.winningTicketRedeemedEvents,
                    ...fetchMoreResult.winningTicketRedeemedEvents,
                  ],
                };
              },
            });
          } catch (e) {
            return e;
          }
        }
      }}
      hasMore={true}
    >
      <Box
        css={{
          marginTop: "$3",
          marginBottom: "$5",
          paddingBottom: "$4",
          position: "relative",
        }}
      >
        <Box css={{ paddingBottom: "$3" }}>
          {mergedEvents.map((event, i: number) => renderSwitch(event, i))}
        </Box>
        {loading && data.transactions.length >= 10 && (
          <Flex
            css={{
              position: "absolute",
              transform: "translateX(-50%)",
              left: "50%",
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Spinner />
          </Flex>
        )}
      </Box>
    </InfiniteScroll>
  );
};

export default Index;

function renderSwitch(event, i: number) {
  switch (event.__typename) {
    case "BondEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>
                Delegated with {formatAddress(event.newDelegate.id)}
              </Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +
                {numbro(event.additionalAmount).format({
                  mantissa: 1,
                  average: true,
                })}
              </Box>{" "}
              LPT
            </Box>
          </Flex>
        </Card>
      );
    case "NewRoundEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Initialized round</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              Round #
              <Box as="span" css={{ fontWeight: 600 }}>
                {event.round.id}
              </Box>
            </Box>
          </Flex>
        </Card>
      );
    case "RebondEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>
                Redelegated with {formatAddress(event.delegate.id)}
              </Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +
                {numbro(event.amount).format({
                  mantissa: 1,
                  average: true,
                })}
              </Box>{" "}
              LPT
            </Box>
          </Flex>
        </Card>
      );
    case "UnbondEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>
                Undelegated from {formatAddress(event.delegate.id)}
              </Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                -
                {numbro(event.amount).format({
                  mantissa: 1,
                  average: true,
                })}
              </Box>{" "}
              LPT
            </Box>
          </Flex>
        </Card>
      );
    case "RewardEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>
                Claimed inflationary token reward
              </Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +
                {numbro(event.rewardTokens).format({
                  mantissa: 2,
                  average: true,
                })}
              </Box>{" "}
              LPT
            </Box>
          </Flex>
        </Card>
      );
    case "TranscoderUpdateEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Updated orchestrator cut</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ textAlign: "right", fontSize: "$2", marginLeft: "$4" }}>
              <Box>
                <Box as="span" css={{ fontWeight: 600 }}>
                  {event.rewardCut / 10000}% R
                </Box>{" "}
              </Box>
              <Box>
                <Box as="span" css={{ fontWeight: 600 }}>
                  {(100 - event.feeShare / 10000)
                    .toFixed(2)
                    .replace(/[.,]00$/, "")}
                  % F
                </Box>{" "}
              </Box>
            </Box>
          </Flex>
        </Card>
      );
    case "WithdrawStakeEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Withdrew undelegated tokens</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                {numbro(event.amount).format({
                  mantissa: 2,
                  average: true,
                })}
              </Box>{" "}
              LPT
            </Box>
          </Flex>
        </Card>
      );
    case "WithdrawFeesEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Withdrew earned fees</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                {numbro(event.amount).format({
                  mantissa: 3,
                  average: true,
                })}
              </Box>{" "}
              ETH
            </Box>
          </Flex>
        </Card>
      );
    case "WinningTicketRedeemedEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Redeemed winning ticket</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +
                {numbro(event.faceValue).format({
                  mantissa: 3,
                  average: true,
                })}
              </Box>{" "}
              ETH
            </Box>
          </Flex>
        </Card>
      );
    case "DepositFundedEvent":
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Deposit funded</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +
                {numbro(event.amount).format({
                  mantissa: 2,
                  average: true,
                })}
              </Box>{" "}
              ETH
            </Box>
          </Flex>
        </Card>
      );
    case "ReserveFundedEvent":
      // Ignore funded reserve events where amount is 0
      // (unable to do this on the graphql query as of now)
      if (+event.amount === 0) {
        return;
      }
      return (
        <Card
          as={A}
          key={i}
          href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>Reserve funded</Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +
                {numbro(event.amount).format({
                  mantissa: 2,
                  average: true,
                })}
              </Box>{" "}
              ETH
            </Box>
          </Flex>
        </Card>
      );
    case "TreasuryVoteEvent":
      const supportTreasuryVoteEvent =
        VOTING_SUPPORT_MAP[event.support] ||
        VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];
      return (
        <Card
          as={A}
          key={i}
          href={`https://explorer.livepeer.org/treasury/${event.proposal?.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>
                Voted on treasury proposal &quot;
                {event.attributes?.title?.trim()}&quot;
              </Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
                as={A}
                href={`https://explorer.livepeer.org/treasury/${event.transaction?.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              <Badge
                size="1"
                css={{
                  backgroundColor:
                    supportTreasuryVoteEvent.style.backgroundColor,
                  color: supportTreasuryVoteEvent.style.color,
                  fontWeight: supportTreasuryVoteEvent.style.fontWeight,
                  fontSize: "$1",
                  border: "none",
                  width: "86px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "$1",
                }}
              >
                <Box
                  as={supportTreasuryVoteEvent.icon}
                  css={{ width: 12, height: 12 }}
                />
                {supportTreasuryVoteEvent.text}
              </Badge>
            </Box>
          </Flex>
        </Card>
      );
    case "VoteEvent":
      const supportVoteEvent = POLL_VOTES[event.choiceID];
      if (!supportVoteEvent) {
        return null;
      }
      return (
        <Card
          as={A}
          key={i}
          href={`https://explorer.livepeer.org/voting/${event.poll?.id}`}
          target="_blank"
          rel="noopener noreferrer"
          css={{
            textDecoration: "none",
            "&:hover": {
              textDecoration: "none",
            },
          }}
        >
          <Flex
            css={{
              width: "100%",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Box css={{ fontWeight: 500 }}>
                Voted on poll &quot;{event.attributes?.title?.trim()}&quot;
              </Box>
              <Box
                css={{ marginTop: "$2", fontSize: "$1", color: "$neutral11" }}
              >
                {dayjs
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  alignItems: "center",
                  marginTop: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
                as={A}
                href={`${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}tx/${event.transaction.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Box css={{ marginRight: "$1" }}>
                  {formatTransactionHash(event.transaction.id)}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", marginLeft: "$4" }}>
              <Badge
                size="1"
                css={{
                  backgroundColor: supportVoteEvent.style.backgroundColor,
                  color: supportVoteEvent.style.color,
                  fontWeight: supportVoteEvent.style.fontWeight,
                  fontSize: "$1",
                  border: "none",
                  width: "86px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "$1",
                }}
              >
                <Box
                  as={supportVoteEvent.icon}
                  css={{ width: 12, height: 12 }}
                />
                {supportVoteEvent.text}
              </Badge>
            </Box>
          </Flex>
        </Card>
      );
    default:
      return null;
  }
}
