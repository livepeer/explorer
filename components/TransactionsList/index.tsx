import EthAddressBadge from "@components/EthAddressBadge";
import Table from "@components/Table";
import TransactionBadge from "@components/TransactionBadge";
import { parseProposalText } from "@lib/api/treasury";
import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import dayjs from "@lib/dayjs";
import { Badge, Box, Flex, Link as A, Text } from "@livepeer/design-system";
import {
  formatETH,
  formatLPT,
  formatPercent,
  formatRound,
} from "@utils/numberFormatters";
import {
  PERCENTAGE_PRECISION_BILLION,
  PERCENTAGE_PRECISION_MILLION,
} from "@utils/web3";
import { EventsQueryResult, TreasuryProposal } from "apollo";
import { sentenceCase } from "change-case";
import { useCallback, useMemo } from "react";

export const FILTERED_EVENT_TYPENAMES = [
  "MintEvent",
  "BurnEvent",
  "EarningsClaimedEvent",
];

const isTinyAmount = (amount: number) => amount > 0 && amount < 0.01;

const getLptAmount = (number: number | string | undefined) => {
  const amount = Number(number ?? 0) || 0;
  const isTinyLPT = isTinyAmount(amount);
  return (
    <Badge size="1">
      {formatLPT(amount, {
        precision: isTinyLPT ? 4 : 2,
        abbreviate: isTinyLPT ? false : true,
      })}
    </Badge>
  );
};

const getEthAmount = (number?: number | string) => {
  const amount = Number(number ?? 0) || 0;
  const isTinyETH = isTinyAmount(amount);
  return (
    <Badge size="1">
      {formatETH(amount, {
        precision: isTinyETH ? 4 : 2,
        abbreviate: isTinyETH ? false : true,
      })}
    </Badge>
  );
};

const getPercentAmount = (number: number | string | undefined) => {
  return (
    <Badge color="white" size="1">
      {formatPercent(number, { precision: 0 })}
    </Badge>
  );
};

const renderEmoji = (emoji: string) => (
  <Box as="span" css={{ marginLeft: 6 }}>
    {emoji}
  </Box>
);

const TransactionsList = ({
  events,
  pageSize = 10,
}: {
  pageSize: number;
  events: NonNullable<
    EventsQueryResult["data"]
  >["transactions"][number]["events"];
}) => {
  const getAccountForRow = useCallback(
    (
      event: NonNullable<
        NonNullable<EventsQueryResult["data"]>["transactions"][number]["events"]
      >[number]
    ) => {
      switch (event.__typename) {
        case "BondEvent":
          return <EthAddressBadge value={event?.delegator?.id} />;

        case "UnbondEvent":
          return <EthAddressBadge value={event?.delegator?.id} />;

        case "RebondEvent":
          return <EthAddressBadge value={event?.delegator?.id} />;

        case "TranscoderUpdateEvent":
          return <EthAddressBadge value={event?.delegate?.id} />;

        case "RewardEvent":
          return <EthAddressBadge value={event?.delegate?.id} />;

        case "WithdrawStakeEvent":
          return <EthAddressBadge value={event?.delegator?.id} />;

        case "WithdrawFeesEvent":
          return <EthAddressBadge value={event?.delegator?.id} />;

        case "WinningTicketRedeemedEvent":
          return <EthAddressBadge value={event?.recipient?.id} />;

        case "DepositFundedEvent":
          return <EthAddressBadge value={event?.sender?.id} />;

        case "ReserveFundedEvent":
          return <EthAddressBadge value={event?.reserveHolder?.id} />;

        case "TransferBondEvent":
          return <EthAddressBadge value={event?.newDelegator?.id} />;

        case "TranscoderActivatedEvent":
          return <EthAddressBadge value={event?.delegate?.id} />;

        case "TranscoderDeactivatedEvent":
          return <EthAddressBadge value={event?.delegate?.id} />;

        // case "EarningsClaimedEvent":
        //   return <EthAddressBadge value={event?.transaction?.from} />;

        case "TranscoderResignedEvent":
          return <EthAddressBadge value={event?.delegate?.id} />;

        case "TranscoderEvictedEvent":
          return <EthAddressBadge value={event?.delegate?.id} />;

        case "NewRoundEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;

        case "WithdrawalEvent":
          return <EthAddressBadge value={event?.sender?.id} />;

        case "SetCurrentRewardTokensEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;
        case "PauseEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;
        case "UnpauseEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;
        case "ParameterUpdateEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;
        case "VoteEvent":
          return <EthAddressBadge value={event?.voter} />;

        case "PollCreatedEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;

        case "ServiceURIUpdateEvent":
          return <EthAddressBadge value={event?.addr} />;

        // case "MintEvent":
        //   return <EthAddressBadge value={event?.to} />;

        case "BurnEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;
        case "MigrateDelegatorFinalizedEvent":
          return <EthAddressBadge value={event?.l2Addr} />;

        case "StakeClaimedEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;

        case "TreasuryVoteEvent":
          return <EthAddressBadge value={event?.transaction?.from} />;

        default:
          return <Box>{`Error fetching event information.`}</Box>;
      }
    },
    []
  );

  const getDescriptionForRow = useCallback(
    (
      event: NonNullable<
        NonNullable<EventsQueryResult["data"]>["transactions"][number]["events"]
      >[number]
    ) => {
      switch (event.__typename) {
        case "BondEvent":
          return event?.additionalAmount === "0" && event?.oldDelegate?.id ? (
            <Box>
              {`Migrated from `}
              <EthAddressBadge value={event?.oldDelegate?.id} />
              {` to `}
              <EthAddressBadge value={event?.newDelegate?.id} />
            </Box>
          ) : (
            <Box>
              {`Delegated `}
              {getLptAmount(event?.additionalAmount)}
              {` to `}
              <EthAddressBadge value={event?.newDelegate?.id} />
            </Box>
          );
        case "UnbondEvent":
          return (
            <Box>
              {`Undelegated `}
              {getLptAmount(event.amount)}
              {` from `}
              <EthAddressBadge value={event?.delegate?.id} />
            </Box>
          );
        case "RebondEvent":
          return (
            <Box>
              {`Rebonded `}
              {getLptAmount(event.amount)}
              {` to `}
              <EthAddressBadge value={event?.delegate?.id} />
            </Box>
          );
        case "TranscoderUpdateEvent":
          return (
            <Box>
              {`Updated their reward/fee cut to `}
              {getPercentAmount(
                Number(event?.rewardCut ?? 0) / PERCENTAGE_PRECISION_MILLION
              )}
              {` and `}
              {getPercentAmount(
                1 - Number(event?.feeShare ?? 0) / PERCENTAGE_PRECISION_MILLION
              )}
            </Box>
          );
        case "RewardEvent":
          return (
            <Box>
              {`Received `}
              {getLptAmount(Number(event?.rewardTokens))}
              {` in newly minted tokens`}
              {renderEmoji("🌿")}
            </Box>
          );
        case "WithdrawStakeEvent":
          return (
            <Box>
              {`Withdrew `}
              {getLptAmount(event?.amount)}
              {` of their stake`}
            </Box>
          );
        case "WithdrawFeesEvent":
          return (
            <Box>
              {`Withdrew `}
              {getEthAmount(event?.amount)}
              {` in fees`}
            </Box>
          );
        case "WinningTicketRedeemedEvent":
          return (
            <Box>
              {`Received a winning ticket for `}
              {getEthAmount(event?.faceValue)}
              {renderEmoji("🎉")}
            </Box>
          );
        case "DepositFundedEvent":
          return (
            <Box>
              {`Funded their deposit for `}
              {getEthAmount(event?.amount)}
            </Box>
          );
        case "ReserveFundedEvent":
          return (
            <Box>
              {`Funded their reserve for `}
              {getEthAmount(event?.amount)}
            </Box>
          );
        case "TransferBondEvent":
          return (
            <Box>
              {getLptAmount(Number(event?.amount))}
              {` was transferred between `}
              <EthAddressBadge value={event?.newDelegator?.id} />
              {` and `}
              <EthAddressBadge value={event?.oldDelegator?.id} />
            </Box>
          );
        case "TranscoderActivatedEvent":
          return (
            <Box>
              {`Starts orchestrating in round `}
              {formatRound(event?.activationRound)}
            </Box>
          );
        case "TranscoderDeactivatedEvent":
          return (
            <Box>
              {`Stops orchestrating in round `}
              {formatRound(event?.deactivationRound)}
            </Box>
          );
        // case "EarningsClaimedEvent":
        //   return event?.rewardTokens ? (
        //     <>
        //       {`Claimed `}
        //       {getLptAmount(event?.rewardTokens)}
        //       {` and `}
        //       {getEthAmount(event?.fees)}
        //       {` in earnings`}
        //     </>
        //   ) : (
        //     <Box>N/A</Box>
        //   );
        case "TranscoderResignedEvent":
          return <Box>{`Resigned from the active set`}</Box>;
        case "TranscoderEvictedEvent":
          return <Box>{`Evicted from the active set`}</Box>;
        case "NewRoundEvent":
          return <Box>{`Initialized a new round`}</Box>;
        case "WithdrawalEvent":
          return (
            <Box>
              {`Withdrew `}
              {getEthAmount(event?.deposit)}
              {` and `}
              {getEthAmount(event?.reserve)}
              {` in deposit and reserve`}
            </Box>
          );
        case "SetCurrentRewardTokensEvent":
          return (
            <Box>
              {`The inflation has been set to `}
              <Badge size="1">
                {formatPercent(
                  Number(event?.currentInflation || 0) /
                    PERCENTAGE_PRECISION_BILLION,
                  { precision: 4 }
                )}
              </Badge>
            </Box>
          );
        case "PauseEvent":
          return <Box>{`The protocol has been paused`}</Box>;
        case "UnpauseEvent":
          return <Box>{`The protocol has been unpaused`}</Box>;
        case "ParameterUpdateEvent":
          return (
            <Box>{`The parameter, ${
              event?.param ?? "unknown"
            }, has been updated`}</Box>
          );
        case "VoteEvent":
          return (
            <Box>
              {`Voted `}
              <Badge
                css={{
                  backgroundColor:
                    +event?.choiceID === 0 ? "$grass3" : "$tomato9",
                  color: +event?.choiceID === 0 ? "$grass11" : "$tomato11",
                }}
                size="1"
              >
                {+event?.choiceID === 0 ? '"For"' : '"Against"'}
              </Badge>
              {` on a proposal`}
              {renderEmoji("👩‍⚖️")}
            </Box>
          );
        case "PollCreatedEvent":
          return (
            <Box>
              {`Poll `}
              <EthAddressBadge value={event?.poll?.id} />
              {` has been created and will end on block ${formatRound(
                event?.endBlock
              )}`}
            </Box>
          );
        case "ServiceURIUpdateEvent":
          return (
            <Box>
              {`Updated service URI to `}
              <Badge size="1">{event?.serviceURI ?? "unknown"}</Badge>
            </Box>
          );
        // case "MintEvent":
        //   We do not handle this case for now, since it is duplicated with RewardEvent
        // case "BurnEvent":
        //   return (
        //     <Box>
        //       {getLptAmount(event?.value)}
        //       {` has been burned`}
        //       {renderEmoji("🔥")}
        //     </Box>
        //   );
        case "MigrateDelegatorFinalizedEvent":
          return <Box>{`Migrated to Arbitrum One`}</Box>;
        case "StakeClaimedEvent":
          return (
            <Box>
              {`Claimed `}
              {getLptAmount(event?.stake)}
              {` from L1 Ethereum`}
            </Box>
          );
        case "TreasuryVoteEvent": {
          const support = VOTING_SUPPORT_MAP[event.support];
          const title = parseProposalText(event.proposal as TreasuryProposal)
            .attributes.title;

          return (
            <Box>
              Voted{" "}
              <Badge css={{ ...support.style }} size="1">
                &quot;{support.text}&quot;
              </Badge>{" "}
              on{" "}
              <Box as={A} href={`/treasury/${event.proposal?.id}`}>
                {title}
              </Box>
            </Box>
          );
        }
        default:
          return <Box>{`Error fetching event information.`}</Box>;
      }
    },
    []
  );

  const columns = useMemo(
    () => [
      {
        Header: "Account",
        accessor: (row) => getAccountForRow(row),
        id: "account",
        Cell: ({ row }) => (
          <Box
            css={{
              minWidth: 150,
            }}
          >
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
                whiteSpace: "nowrap",
              }}
              size="2"
            >
              {row.values.account}
            </Text>
          </Box>
        ),
      },
      {
        Header: "Event",
        accessor: (row) => row?.__typename,
        id: "event",
        Cell: ({ row }) => (
          <Box
            css={{
              minWidth: 200,
            }}
          >
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
                whiteSpace: "nowrap",
              }}
              size="2"
            >
              {row?.values?.event === "ServiceURIUpdateEvent"
                ? "Service URI update"
                : sentenceCase(
                    String(row?.values?.event ?? "Not applicable").replace(
                      "Event",
                      ""
                    )
                  )}
            </Text>
          </Box>
        ),
      },
      {
        Header: <Flex css={{ flex: 1 }}>Description</Flex>,
        accessor: (row) => getDescriptionForRow(row),
        id: "description",
        Cell: ({ row }) => (
          <Box
            css={{
              minWidth: 400,
            }}
          >
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
                whiteSpace: "nowrap",
              }}
              size="2"
            >
              {row.values.description}
            </Text>
          </Box>
        ),
      },
      {
        Header: "Date",
        id: "timestamp",
        accessor: (row) => row.transaction.timestamp,
        Cell: ({ row }) => (
          <Box css={{ minWidth: 100 }}>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
                whiteSpace: "nowrap",
              }}
              size="2"
            >
              {dayjs.unix(row.original.transaction.timestamp).fromNow()}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
      {
        Header: "Transaction",
        accessor: (row) => row.transaction.id,
        id: "transaction",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 130 }}>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              <TransactionBadge id={row.values.transaction} />
            </Text>
          </Box>
        ),
      },
    ],
    [getDescriptionForRow, getAccountForRow]
  );

  return (
    <Table
      data={events as object[]}
      columns={columns}
      initialState={{
        pageSize,
        sortBy: [
          {
            id: "timestamp",
            desc: true,
          },
        ],
      }}
    />
  );
};

export default TransactionsList;
