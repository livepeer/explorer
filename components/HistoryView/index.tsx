import Spinner from "@components/Spinner";
import dayjs from "@lib/dayjs";
import {
  Box,
  Card as CardBase,
  Flex,
  Link as A,
  styled,
} from "@livepeer/design-system";
import { ExternalLinkIcon } from "@modulz/radix-icons";
import { useTransactionsQuery } from "apollo";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useRouter } from "next/router";
import numbro from "numbro";
import { useMemo } from "react";
import InfiniteScroll from "react-infinite-scroll-component";

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

  const { data, loading, error, fetchMore, stopPolling } = useTransactionsQuery(
    {
      variables: {
        account: account.toLowerCase(),
        first: 10,
        skip: 0,
      },
      notifyOnNetworkStatusChange: true,
    }
  );

  const events = useMemo(
    () =>
      data?.transactions?.reduce(
        (res, { events: e }) => res.concat(e as any),
        []
      ) ?? [],
    [data]
  );

  const lastEventTimestamp = useMemo(
    () =>
      Number(
        (events?.[(events?.length || 0) - 1] as any)?.transaction?.timestamp ??
          0
      ),
    [events]
  );

  // performs filtering of winning ticket redeemed events and merges with separate "winning tickets"
  // this is so Os winning tickets show properly: https://github.com/livepeer/explorer/issues/108
  const mergedEvents = useMemo(
    () =>
      [
        ...events.filter(
          (e) => (e as any)?.__typename !== "WinningTicketRedeemedEvent"
        ),
        ...(data?.winningTicketRedeemedEvents?.filter(
          (e) => (e?.transaction?.timestamp ?? 0) > lastEventTimestamp
        ) ?? []),
      ].sort(
        (a, b) =>
          (b?.transaction?.timestamp ?? 0) - (a?.transaction?.timestamp ?? 0)
      ),
    [events, data, lastEventTimestamp]
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
            await fetchMore({
              variables: {
                skip: data.transactions.length,
              },
              updateQuery: (previousResult: any, { fetchMoreResult }: any) => {
                if (!fetchMoreResult) {
                  return previousResult;
                }
                return {
                  ...previousResult,
                  transactions: [
                    ...previousResult.transactions,
                    ...fetchMoreResult.transactions,
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
          {mergedEvents.map((event: any, i: number) => renderSwitch(event, i))}
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

function renderSwitch(event: any, i: number) {
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
                Delegated with{" "}
                {event.newDelegate.id.replace(
                  event.newDelegate.id.slice(7, 37),
                  "…"
                )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                Redelegated with{" "}
                {event.delegate.id.replace(event.delegate.id.slice(7, 37), "…")}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                Undelegated from{" "}
                {event.delegate.id.replace(event.delegate.id.slice(7, 37), "…")}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
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
    default:
      return null;
  }
}
