import Table from "@components/Table";
import { l1Provider } from "@lib/chains";
import { Badge, Box, Flex, Text, Tooltip } from "@livepeer/design-system";
import { ChevronDownIcon } from "@modulz/radix-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ValuesOfCorrectTypeRule } from "graphql";
import Link from "next/link";
import numeral from "numeral";
import { useEffect, useMemo, useState } from "react";
import { useEnsAddress, useEnsName } from "wagmi";

dayjs.extend(relativeTime);

const getLptAmount = (number: number | string | undefined) => {
  return (
    <Badge size="1">{`${numeral(number || 0).format("0.00a")} LPT`}</Badge>
  );
};

const getEthAmount = (number: number | string | undefined) => {
  return (
    <Badge size="1">{`${numeral(number || 0).format("0.00a")} ETH`}</Badge>
  );
};

const getRound = (number: number | string | undefined) => {
  return `#${numeral(number || 0).format("0")}`;
};

const getPercentAmount = (number: number | string | undefined) => {
  return (
    <Badge color="white" size="1">
      {numeral(number || 0).format("0%")}
    </Badge>
  );
};

const EthAddress = (props: { value: string | undefined }) => {
  const { data } = useEnsName({ address: props.value, cacheTime: 30000 });

  return (
    <Link passHref href={`/accounts/${props.value}/delegating`}>
      <Badge css={{ cursor: "pointer" }} variant="primary" size="1">
        {data
          ? data
          : props.value
          ? props.value.replace(props.value.slice(5, 39), "…")
          : "A user"}
      </Badge>
    </Link>
  );
};

const renderEmoji = (emoji: string) => (
  <Box as="span" css={{ ml: 6 }}>
    {emoji}
  </Box>
);

const getVerbiageForRow = (event) => {
  // console.log({ event });
  switch (event.__typename) {
    case "BondEvent":
      return (
        <Box>
          <EthAddress value={event?.delegator?.id} />
          {` delegated `}
          {getLptAmount(event?.additionalAmount)}
          {` to `}
          <EthAddress value={event?.newDelegate?.id} />
        </Box>
      );
    case "UnbondEvent":
      return (
        <Box>
          <EthAddress value={event?.delegator?.id} />
          {` undelegated `}
          {getLptAmount(event.amount)}
          {` from `}
          <EthAddress value={event?.delegate?.id} />
        </Box>
      );
    case "RebondEvent":
      return (
        <Box>
          <EthAddress value={event?.delegator?.id} />
          {` rebonded `}
          {getLptAmount(event.amount)}
          {` to `}
          <EthAddress value={event?.delegate?.id} />
        </Box>
      );
    case "TranscoderUpdateEvent":
      return (
        <Box>
          <EthAddress value={event?.delegate?.id} />
          {` updated their reward/fee cut to `}
          {getPercentAmount(Number(event?.rewardCut ?? 0) / 1000000)}
          {` and `}
          {getPercentAmount(1 - Number(event?.feeShare ?? 0) / 1000000)}
        </Box>
      );
    case "RewardEvent":
      return (
        <Box>
          <EthAddress value={event?.delegate?.id} />
          {` received `}
          {getLptAmount(Number(event?.rewardTokens))}
          {` rewards`}
        </Box>
      );
    case "WithdrawStakeEvent":
      return (
        <Box>
          <EthAddress value={event?.delegator?.id} />
          {` withdrew `}
          {getLptAmount(event?.amount)}
          {` of their stake`}
        </Box>
      );
    case "WithdrawFeesEvent":
      return (
        <Box>
          <EthAddress value={event?.delegator?.id} />
          {` withdrew `}
          {getEthAmount(event?.amount)}
          {` in fees`}
        </Box>
      );
    case "WinningTicketRedeemedEvent":
      return (
        <Box>
          <EthAddress value={event?.recipient?.id} />
          {` received a winning ticket for `}
          {getEthAmount(event?.faceValue)}
          {renderEmoji("🎉")}
        </Box>
      );
    case "DepositFundedEvent":
      return (
        <Box>
          <EthAddress value={event?.sender?.id} />
          {` funded their deposit for `}
          {getEthAmount(event?.amount)}
        </Box>
      );
    case "ReserveFundedEvent":
      return (
        <Box>
          <EthAddress value={event?.reserveHolder?.id} />
          {` funded their reserve for `}
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
          {` for transfer of bond`}
        </Box>
      );
    case "TranscoderActivatedEvent":
      return (
        <Box>
          <EthAddress value={event?.delegate?.id} />
          {` will start orchestrating in round `}
          {getRound(event?.activationRound)}
        </Box>
      );
    case "TranscoderDeactivatedEvent":
      return (
        <Box>
          <EthAddress value={event?.delegate?.id} />
          {` will stop orchestrating in round `}
          {getRound(event?.deactivationRound)}
        </Box>
      );
    case "EarningsClaimedEvent":
      return event?.rewardTokens ? (
        <>
          <EthAddress value={event?.delegate?.id} />
          {` claimed `}
          {getLptAmount(event?.rewardTokens)}
          {` and `}
          {getEthAmount(event?.fees)}
          {` in earnings`}
        </>
      ) : (
        "N/A"
      );
    case "TranscoderResignedEvent":
      return (
        <Box>
          <EthAddress value={event?.delegate?.id} />
          {` has resigned from the active set`}
        </Box>
      );
    case "TranscoderEvictedEvent":
      return (
        <Box>
          <EthAddress value={event?.delegate?.id} />
          {` has been evicted from the active set`}
        </Box>
      );
    case "NewRoundEvent":
      return (
        <Box>
          <EthAddress value={event?.transaction?.from} />
          {` has started a new round`}
        </Box>
      );
    case "WithdrawalEvent":
      return (
        <Box>
          <EthAddress value={event?.sender?.id} />
          {` has withdrawn `}
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
            {numeral(event?.currentInflation || 0)
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
          <EthAddress value={event?.voter} />
          {` has voted `}
          <Badge variant={event?.choiceID === 0 ? "primary" : "red"} size="1">
            {event?.choiceID === 0 ? '"Yes"' : '"No"'}
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
          <EthAddress value={event?.addr} />
          {` has updated their service URI to `}
          <Badge size="1">{event?.serviceURI ?? "unknown"}</Badge>
        </Box>
      );
    case "MintEvent":
      return (
        <Box>
          <EthAddress value={event?.to} />
          {` has received `}
          {getLptAmount(event?.amount)}
          {` in newly minted tokens`}
          {renderEmoji("🌿")}
        </Box>
      );
    case "BurnEvent":
      return (
        <Box>
          {getLptAmount(event?.value)}
          {` has been burned`}
          {renderEmoji("🔥")}
        </Box>
      );
    case "MigrateDelegatorFinalizedEvent":
      return (
        <Box>
          <EthAddress value={event?.l2Addr} />
          {` has been migrated to Arbitrum One.`}
        </Box>
      );
    case "StakeClaimedEvent":
      return (
        <Box>
          <EthAddress value={event?.transaction?.from} />
          {` has claimed `}
          {getEthAmount(event?.stake)}
          {` stake from L1 Ethereum`}
        </Box>
      );

    default:
      return <Box>{`Error fetching event information.`}</Box>;
  }
};

const TransactionsList = ({ events, pageSize = 10 }) => {
  const columns = useMemo(
    () => [
      {
        Header: <Flex css={{ flex: 1 }}>Event</Flex>,
        accessor: (row) => getVerbiageForRow(row),
        id: "event",
        Cell: ({ row }) => (
          <Box
            css={{
              width: 700,
              display: "block",
              textDecoration: "none",
              overflow: "hidden",
              "&:hover": { textDecoration: "none" },
              "@bp3": {
                width: 850,
              },
            }}
          >
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {row.values.event}
            </Text>
          </Box>
        ),
      },
      {
        Header: "Date",
        id: "timestamp",
        accessor: (row) => row.transaction.timestamp,
        Cell: ({ row }) => (
          <Box>
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
                whiteSpace: "nowrap",
              }}
              size="2"
            >
              {dayjs
                .unix(row.original.transaction.timestamp)
                .format("M/D/YY, H:mm:ss A")}
            </Text>
          </Box>
        ),
        sortType: "number",
      },
    ],
    []
  );

  return (
    <Table
      data={events}
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
