import Table from "@components/Table";
import { Badge, Box, Flex, Text, Link as A } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { EventsQueryResult } from "apollo";
import { sentenceCase } from "change-case";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEnsData } from "hooks";
import Link from "next/link";
import numbro from "numbro";
import { useCallback, useMemo } from "react";

dayjs.extend(relativeTime);

export const FILTERED_EVENT_TYPENAMES = [
  "MintEvent",
  "BurnEvent",
  "EarningsClaimedEvent",
];

const getLptAmount = (number: number | string | undefined) => {
  return (
    <Badge size="1">{`${numbro(number || 0).format("0.00a")} LPT`}</Badge>
  );
};

const getEthAmount = (number: number | string | undefined) => {
  return (
    <Badge size="1">{`${numbro(number || 0).format("0.000a")} ETH`}</Badge>
  );
};

const getRound = (number: number | string | undefined) => {
  return `#${numbro(number || 0).format("0")}`;
};

const getPercentAmount = (number: number | string | undefined) => {
  return (
    <Badge color="white" size="1">
      {numbro(number || 0).format({mantissa:0, output: "percent"})}
    </Badge>
  );
};

const EthAddress = (props: { value: string | undefined }) => {
  const ensName = useEnsData(props.value);

  return (
    <Link passHref href={`/accounts/${props.value}/delegating`}>
      <Badge css={{ cursor: "pointer" }} variant="primary" size="1">
        {ensName?.name ? ensName?.name : ensName?.idShort ?? ""}
      </Badge>
    </Link>
  );
};

const Transaction = (props: { id: string | undefined }) => {
  return (
    <A
      target="_blank"
      rel="noopener noreferrer"
      variant="primary"
      href={
        props.id ? `https://arbiscan.io/tx/${props.id}` : "https://arbiscan.io"
      }
    >
      <Badge css={{ cursor: "pointer" }} variant="primary" size="1">
        {props.id ? props.id.replace(props.id.slice(6, 62), "…") : "N/A"}
        <Box css={{ ml: "$1", width: 15, height: 15 }} as={ArrowTopRightIcon} />
      </Badge>
    </A>
  );
};

const renderEmoji = (emoji: string) => (
  <Box as="span" css={{ ml: 6 }}>
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
          return <EthAddress value={event?.delegator?.id} />;

        case "UnbondEvent":
          return <EthAddress value={event?.delegator?.id} />;

        case "RebondEvent":
          return <EthAddress value={event?.delegator?.id} />;

        case "TranscoderUpdateEvent":
          return <EthAddress value={event?.delegate?.id} />;

        case "RewardEvent":
          return <EthAddress value={event?.delegate?.id} />;

        case "WithdrawStakeEvent":
          return <EthAddress value={event?.delegator?.id} />;

        case "WithdrawFeesEvent":
          return <EthAddress value={event?.delegator?.id} />;

        case "WinningTicketRedeemedEvent":
          return <EthAddress value={event?.recipient?.id} />;

        case "DepositFundedEvent":
          return <EthAddress value={event?.sender?.id} />;

        case "ReserveFundedEvent":
          return <EthAddress value={event?.reserveHolder?.id} />;

        case "TransferBondEvent":
          return <EthAddress value={event?.newDelegator?.id} />;

        case "TranscoderActivatedEvent":
          return <EthAddress value={event?.delegate?.id} />;

        case "TranscoderDeactivatedEvent":
          return <EthAddress value={event?.delegate?.id} />;

        // case "EarningsClaimedEvent":
        //   return <EthAddress value={event?.transaction?.from} />;

        case "TranscoderResignedEvent":
          return <EthAddress value={event?.delegate?.id} />;

        case "TranscoderEvictedEvent":
          return <EthAddress value={event?.delegate?.id} />;

        case "NewRoundEvent":
          return <EthAddress value={event?.transaction?.from} />;

        case "WithdrawalEvent":
          return <EthAddress value={event?.sender?.id} />;

        case "SetCurrentRewardTokensEvent":
          return <EthAddress value={event?.transaction?.from} />;
        case "PauseEvent":
          return <EthAddress value={event?.transaction?.from} />;
        case "UnpauseEvent":
          return <EthAddress value={event?.transaction?.from} />;
        case "ParameterUpdateEvent":
          return <EthAddress value={event?.transaction?.from} />;
        case "VoteEvent":
          return <EthAddress value={event?.voter} />;

        case "PollCreatedEvent":
          return <EthAddress value={event?.transaction?.from} />;

        case "ServiceURIUpdateEvent":
          return <EthAddress value={event?.addr} />;

        // case "MintEvent":
        //   return <EthAddress value={event?.to} />;

        case "BurnEvent":
          return <EthAddress value={event?.transaction?.from} />;
        case "MigrateDelegatorFinalizedEvent":
          return <EthAddress value={event?.l2Addr} />;

        case "StakeClaimedEvent":
          return <EthAddress value={event?.transaction?.from} />;

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
              <EthAddress value={event?.oldDelegate?.id} />
              {` to `}
              <EthAddress value={event?.newDelegate?.id} />
            </Box>
          ) : (
            <Box>
              {`Delegated `}
              {getLptAmount(event?.additionalAmount)}
              {` to `}
              <EthAddress value={event?.newDelegate?.id} />
            </Box>
          );
        case "UnbondEvent":
          return (
            <Box>
              {`Undelegated `}
              {getLptAmount(event.amount)}
              {` from `}
              <EthAddress value={event?.delegate?.id} />
            </Box>
          );
        case "RebondEvent":
          return (
            <Box>
              {`Rebonded `}
              {getLptAmount(event.amount)}
              {` to `}
              <EthAddress value={event?.delegate?.id} />
            </Box>
          );
        case "TranscoderUpdateEvent":
          return (
            <Box>
              {`Updated their reward/fee cut to `}
              {getPercentAmount(Number(event?.rewardCut ?? 0) / 1000000)}
              {` and `}
              {getPercentAmount(1 - Number(event?.feeShare ?? 0) / 1000000)}
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
              <EthAddress value={event?.newDelegator?.id} />
              {` and `}
              <EthAddress value={event?.oldDelegator?.id} />
            </Box>
          );
        case "TranscoderActivatedEvent":
          return (
            <Box>
              {`Starts orchestrating in round `}
              {getRound(event?.activationRound)}
            </Box>
          );
        case "TranscoderDeactivatedEvent":
          return (
            <Box>
              {`Stops orchestrating in round `}
              {getRound(event?.deactivationRound)}
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
                {numbro(event?.currentInflation || 0)
                  .divide(1000000000)
                  .format("0.0000%")}
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
                variant={+event?.choiceID === 0 ? "primary" : "red"}
                size="1"
              >
                {+event?.choiceID === 0 ? '"Yes"' : '"No"'}
              </Badge>
              {` on a proposal`}
              {renderEmoji("👩‍⚖️")}
            </Box>
          );
        case "PollCreatedEvent":
          return (
            <Box>
              {`Poll `}
              <EthAddress value={event?.poll?.id} />
              {` has been created and will end on block ${getRound(
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
              <Transaction id={row.values.transaction} />
            </Text>
          </Box>
        ),
      },
    ],
    [getDescriptionForRow, getAccountForRow]
  );

  return (
    <Table
      data={events as any}
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
