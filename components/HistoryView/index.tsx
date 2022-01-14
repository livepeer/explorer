import { abbreviateNumber } from "@lib/utils";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client";
import Spinner from "@components/Spinner";
import moment from "moment";
import InfiniteScroll from "react-infinite-scroll-component";
import { historyQuery } from "../../queries/historyQuery";
import {
  Flex,
  Box,
  Card as CardBase,
  Link as A,
  styled,
} from "@livepeer/design-system";
import { ExternalLinkIcon } from "@modulz/radix-icons";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "constants/chains";

const Card = styled(CardBase, {
  border: "1px solid $neutral3",
  mb: "$2",
  p: "$4",
});

const Index = () => {
  const router = useRouter();
  const query = router.query;
  const account = query.account as string;

  const { data, loading, error, fetchMore, stopPolling } = useQuery(
    historyQuery,
    {
      variables: {
        account: account.toLowerCase(),
        first: 10,
        skip: 0,
      },
      notifyOnNetworkStatusChange: true,
    }
  );

  if (error) {
    console.error(error);
  }

  if (loading && !data) {
    return (
      <Flex
        css={{
          pt: "$5",
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
    return <Box css={{ pt: "$3" }}>No history</Box>;
  }

  const events = data.transactions.reduce(
    (res, { events: e }) => res.concat(e),
    []
  );

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
      <Box css={{ mt: "$3", mb: "$5", pb: "$4", position: "relative" }}>
        <Box css={{ pb: "$3" }}>
          {events.map((event: any, i: number) => renderSwitch(event, i))}
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
                Staked with{" "}
                {event.newDelegate.id.replace(
                  event.newDelegate.id.slice(7, 37),
                  "…"
                )}
              </Box>
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +{abbreviateNumber(event.additionalAmount, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +{abbreviateNumber(event.amount, 3)}
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
                Unstaked from{" "}
                {event.delegate.id.replace(event.delegate.id.slice(7, 37), "…")}
              </Box>
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                -{abbreviateNumber(event.amount, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +{abbreviateNumber(event.rewardTokens, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ textAlign: "right", fontSize: "$2", ml: "$4" }}>
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
              <Box css={{ fontWeight: 500 }}>Withdrew unstaked tokens</Box>
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                {abbreviateNumber(event.amount, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                {abbreviateNumber(event.amount, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +{abbreviateNumber(event.faceValue, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +{abbreviateNumber(event.amount, 3)}
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
              <Box css={{ mt: "$2", fontSize: "$1", color: "$neutral11" }}>
                {moment
                  .unix(event.transaction.timestamp)
                  .format("MM/DD/YYYY h:mm:ss a")}{" "}
                - Round #{event.round.id}
              </Box>
              <Flex
                css={{
                  ai: "center",
                  mt: "$2",
                  fontSize: "$1",
                  color: "$neutral11",
                }}
              >
                <Box css={{ mr: "$1" }}>
                  {event.transaction.id.replace(
                    event.transaction.id.slice(6, 62),
                    "…"
                  )}
                </Box>
                <ExternalLinkIcon />
              </Flex>
            </Box>
            <Box css={{ fontSize: "$3", ml: "$4" }}>
              {" "}
              <Box as="span" css={{ fontWeight: 600 }}>
                +{abbreviateNumber(event.amount, 3)}
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
