import { ExplorerTooltip } from "@components/ExplorerTooltip";
import IdentityAvatar from "@components/IdentityAvatar";
import PopoverLink from "@components/PopoverLink";
import Table from "@components/Table";
import { textTruncate } from "@lib/utils";
import {
  Badge,
  Box,
  Flex,
  IconButton,
  Link as A,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Text,
} from "@livepeer/design-system";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { formatStakeAmount } from "@utils/numberFormatters";
import { OrchestratorDelegatorsQuery } from "apollo";
import { useEnsData, usePendingFeesAndStakeData } from "hooks";
import Link from "next/link";
import { useMemo } from "react";
import { Column, Row } from "react-table";

type Delegator = NonNullable<
  NonNullable<OrchestratorDelegatorsQuery["transcoder"]>["delegators"]
>[number];

type DelegatorRow = Delegator & {
  bondedAmountNumber: number;
  startRoundNumber: number;
};

// Compare the already-numeric row values directly. react-table's built-in
// "number" sortType stringifies each value and strips non-numeric chars, which
// mangles values rendered in exponential notation (e.g. 9.4e-7 -> "9.47"),
// scattering sub-1e-6 "dust" amounts into the middle of the list.
const numericSort = (
  rowA: Row<DelegatorRow>,
  rowB: Row<DelegatorRow>,
  columnId: string
) =>
  (Number(rowA.values[columnId]) || 0) - (Number(rowB.values[columnId]) || 0);

const DelegatorList = ({
  data,
  pageSize = 10,
}: {
  pageSize?: number;
  data:
    | NonNullable<OrchestratorDelegatorsQuery["transcoder"]>["delegators"]
    | undefined;
}) => {
  const rows: DelegatorRow[] = useMemo(
    () =>
      (data ?? []).map((delegator) => ({
        ...delegator,
        bondedAmountNumber: Number(delegator?.bondedAmount ?? 0),
        startRoundNumber: Number(delegator?.startRound ?? 0),
      })),
    [data]
  );

  const columns: Column<DelegatorRow>[] = useMemo(
    () => [
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                An account that has delegated stake to this orchestrator.
              </Box>
            }
          >
            <Box>Delegator</Box>
          </ExplorerTooltip>
        ),
        accessor: "id",
        Cell: ({ row, value }) => {
          const address = value as string;
          const identity = useEnsData(address);
          const ensName = identity?.name;
          const shortAddress = address.replace(address.slice(6, 38), "…");

          return (
            <A
              as={Link}
              href={`/accounts/${address}/delegating`}
              passHref
              css={{
                width: 300,
                display: "block",
                textDecoration: "none",
                "&:hover": { textDecoration: "none" },
              }}
            >
              <Flex css={{ alignItems: "center" }}>
                <Box
                  css={{
                    marginRight: "$2",
                    backgroundColor: "$neutral4",
                    borderRadius: 1000,
                    color: "$neutral11",
                    fontWeight: 700,
                    width: 24,
                    height: 24,
                    minWidth: 24,
                    minHeight: 24,
                    fontSize: 11,
                    justifyContent: "center",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {row.index + 1}
                </Box>
                <Flex css={{ marginRight: "$2", alignItems: "center" }}>
                  <IdentityAvatar
                    identity={identity}
                    address={address}
                    size={28}
                    css={{ marginRight: "$2" }}
                  />
                  {ensName ? (
                    <Flex css={{ fontWeight: 600, alignItems: "center" }}>
                      <Box
                        css={{
                          marginRight: "$2",
                          fontSize: "$3",
                        }}
                      >
                        {textTruncate(ensName, 20, "…")}
                      </Box>
                      <Badge size="2" css={{ fontSize: "$2" }}>
                        {address.substring(0, 6)}
                      </Badge>
                    </Flex>
                  ) : (
                    <Box css={{ fontWeight: 600 }}>{shortAddress}</Box>
                  )}
                </Flex>
              </Flex>
            </A>
          );
        },
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The amount of stake this account has bonded to the orchestrator,
                excluding rewards not yet claimed (see Pending Rewards).
              </Box>
            }
          >
            <Box>Stake</Box>
          </ExplorerTooltip>
        ),
        accessor: "bondedAmountNumber",
        Cell: ({ value }) => (
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {formatStakeAmount(Number(value ?? 0))}
          </Text>
        ),
        sortType: numericSort,
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                Rewards earned from this orchestrator that have not been claimed
                yet. Stake + Pending Rewards equals the account&apos;s current
                total stake.
              </Box>
            }
          >
            <Box css={{ whiteSpace: "nowrap" }}>Pending Rewards</Box>
          </ExplorerTooltip>
        ),
        // Live pendingStake is fetched per row (on-screen only), so this column
        // has no row-model value and cannot be globally sorted.
        id: "pendingRewards",
        disableSortBy: true,
        Cell: ({ row }) => {
          const { id, bondedAmountNumber } = row.original;
          const data = usePendingFeesAndStakeData(id);
          // Pending rewards = live total stake − bonded amount (never negative).
          const rewards = data
            ? Math.max(0, Number(data.pendingStake) / 1e18 - bondedAmountNumber)
            : undefined;

          return (
            <Text
              css={{
                fontWeight: 600,
                color: "$white",
              }}
              size="2"
            >
              {rewards === undefined ? "—" : formatStakeAmount(rewards)}
            </Text>
          );
        },
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={<Box>The round this account became bonded.</Box>}
          >
            <Box css={{ whiteSpace: "nowrap" }}>Start Round</Box>
          </ExplorerTooltip>
        ),
        accessor: "startRoundNumber",
        Cell: ({ value }) => (
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {value ? Number(value) : "N/A"}
          </Text>
        ),
        sortType: numericSort,
      },
      {
        Header: <></>,
        id: "actions",
        Cell: ({ row }) => (
          <Popover>
            <PopoverTrigger
              onClick={(e) => {
                e.stopPropagation();
              }}
              asChild
            >
              <Flex css={{ alignItems: "center" }}>
                <IconButton
                  aria-label="Delegator actions"
                  css={{
                    cursor: "pointer",
                    marginLeft: "$1",
                    opacity: 1,
                    transition: "background-color .3s",
                    "&:hover": {
                      bc: "$primary5",
                      transition: "background-color .3s",
                    },
                  }}
                >
                  <DotsHorizontalIcon />
                </IconButton>
              </Flex>
            </PopoverTrigger>
            <PopoverContent
              css={{ borderRadius: "$4", bc: "$neutral4" }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Flex
                css={{
                  flexDirection: "column",
                  padding: "$1",
                  borderBottom: "1px solid $neutral6",
                }}
              >
                <Text
                  variant="neutral"
                  size="1"
                  css={{
                    marginLeft: "$3",
                    marginTop: "$2",
                    marginBottom: "$2",
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Account Details
                </Text>

                <PopoverLink href={`/accounts/${row.values.id}/delegating`}>
                  Profile
                </PopoverLink>
                <PopoverLink href={`/accounts/${row.values.id}/history`}>
                  History
                </PopoverLink>
              </Flex>
            </PopoverContent>
          </Popover>
        ),
      },
    ],
    []
  );

  if (!rows?.length) {
    return (
      <Box
        css={{
          border: "1px solid $neutral4",
          borderRadius: "$4",
          padding: "$4",
          backgroundColor: "$neutral3",
        }}
      >
        <Text>No delegators found.</Text>
      </Box>
    );
  }

  return (
    <Table
      data={rows}
      columns={columns}
      minWidth={700}
      initialState={{
        pageIndex: 0,
        pageSize,
        sortBy: [{ id: "bondedAmountNumber", desc: true }],
      }}
    />
  );
};

export default DelegatorList;
