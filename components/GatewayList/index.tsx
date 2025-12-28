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
import { GatewaysQuery } from "apollo";
import { useEnsData } from "hooks";
import Link from "next/link";
import numbro from "numbro";
import { useMemo } from "react";
import { Column } from "react-table";

type GatewayRow = NonNullable<GatewaysQuery["gateways"]>[number] & {
  depositNumber: number;
  reserveNumber: number;
  ninetyDayVolumeNumber: number;
  totalVolumeNumber: number;
  lastActiveDayNumber: number;
};

const formatEth = (value: number) => {
  const amount = Number(value ?? 0) || 0;
  return `${numbro(amount).format(
    amount > 0 && amount < 0.01
      ? { mantissa: 4, trimMantissa: true }
      : { mantissa: 2, average: true, lowPrecision: false }
  )} ETH`;
};

const GatewayList = ({
  data,
  pageSize = 10,
}: {
  pageSize?: number;
  data: GatewaysQuery["gateways"] | undefined;
}) => {
  const rows: GatewayRow[] = useMemo(
    () =>
      (data ?? []).map((gateway) => ({
        ...gateway,
        depositNumber: Number(gateway?.deposit ?? 0),
        reserveNumber: Number(gateway?.reserve ?? 0),
        ninetyDayVolumeNumber: Number(gateway?.ninetyDayVolumeETH ?? 0),
        totalVolumeNumber: Number(gateway?.totalVolumeETH ?? 0),
        lastActiveDayNumber: Number(gateway?.lastActiveDay ?? 0),
      })),
    [data]
  );

  const columns: Column<GatewayRow>[] = useMemo(
    () => [
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={
              <Box>
                The account which is actively routing jobs to orchestrators and
                paying fees.
              </Box>
            }
          >
            <Box>Gateway</Box>
          </ExplorerTooltip>
        ),
        id: "gateway",
        accessor: "id",
        disableSortBy: true,
        Cell: ({ row, value }) => {
          const address = value as string;
          const identity = useEnsData(address);
          const ensName = identity?.name;
          const shortAddress = address.replace(address.slice(6, 38), "…");

          return (
            <A
              as={Link}
              href={`/accounts/${address}/broadcasting`}
              passHref
              css={{
                width: 350,
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
            content={<Box>Current deposit balance funded for payouts.</Box>}
          >
            <Box>Deposit</Box>
          </ExplorerTooltip>
        ),
        id: "depositNumber",
        accessor: "depositNumber",
        Cell: ({ value }) => (
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {formatEth(Number(value ?? 0))}
          </Text>
        ),
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={<Box>Reserve funds available for winning tickets.</Box>}
          >
            <Box>Reserve</Box>
          </ExplorerTooltip>
        ),
        id: "reserveNumber",
        accessor: "reserveNumber",
        Cell: ({ value }) => (
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {formatEth(Number(value ?? 0))}
          </Text>
        ),
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={<Box>Fees distributed over the last 90 days.</Box>}
          >
            <Box>90d Fees</Box>
          </ExplorerTooltip>
        ),
        id: "ninetyDayVolumeNumber",
        accessor: "ninetyDayVolumeNumber",
        Cell: ({ value }) => (
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {formatEth(Number(value ?? 0))}
          </Text>
        ),
        sortType: "number",
      },
      {
        Header: (
          <ExplorerTooltip
            multiline
            content={<Box>Lifetime fees distributed on-chain.</Box>}
          >
            <Box>Total Fees</Box>
          </ExplorerTooltip>
        ),
        id: "totalVolumeNumber",
        accessor: "totalVolumeNumber",
        Cell: ({ value }) => (
          <Text
            css={{
              fontWeight: 600,
              color: "$white",
            }}
            size="2"
          >
            {formatEth(Number(value ?? 0))}
          </Text>
        ),
        sortType: "number",
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
                  aria-label="Gateway actions"
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
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
              placeholder={undefined}
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

                <PopoverLink href={`/accounts/${row.values.id}/broadcasting`}>
                  Profile
                </PopoverLink>
                <PopoverLink
                  href={`/accounts/${row.values.id}/broadcasting?tab=history`}
                >
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
        <Text>No gateways found.</Text>
      </Box>
    );
  }

  return (
    <Table
      data={rows}
      columns={columns}
      initialState={{
        pageIndex: 0,
        pageSize,
        sortBy: [{ id: "ninetyDayVolumeNumber", desc: true }],
      }}
    />
  );
};

export default GatewayList;
