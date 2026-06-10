import EthAddressBadge from "@components/EthAddressBadge";
import { ExplorerTooltip } from "@components/ExplorerTooltip";
import DataTable from "@components/Table";
import TransactionBadge from "@components/TransactionBadge";
import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import { Badge, Box, Text } from "@livepeer/design-system";
import { CounterClockwiseClockIcon } from "@radix-ui/react-icons";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { Column } from "react-table";

import { PollVoteType } from ".";

export interface PollVoteTableProps {
  votes: PollVoteType[];
  onSelect: (voter: {
    address: string;
    voteStake: string;
    ensName?: string;
  }) => void;
  pageSize?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  formatVoteStake: (stake: string) => string;
}

export const DesktopVoteTable: React.FC<PollVoteTableProps> = ({
  votes,
  onSelect,
  pageSize = 10,
  formatVoteStake,
}) => {
  const columns = useMemo<Column<PollVoteType>[]>(
    () => [
      {
        Header: "Voter",
        accessor: "ensName",
        id: "voter",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 120 }}>
            <EthAddressBadge value={row.original.voter} />
          </Box>
        ),
      },
      {
        Header: "Support",
        accessor: "choiceID",
        id: "support",
        Cell: ({ row }) => {
          const support = VOTING_SUPPORT_MAP[row.original.choiceID];

          return (
            <Box css={{ minWidth: 100 }}>
              <Badge
                size="1"
                css={{
                  backgroundColor: support.style.backgroundColor,
                  color: support.style.color,
                  fontWeight: support.style.fontWeight,
                  border: "none",
                  width: "86px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "$1",
                }}
              >
                <Box as={support.icon} css={{ width: 12, height: 12 }} />
                {support.text}
              </Badge>
            </Box>
          );
        },
      },
      {
        Header: "Weight",
        accessor: "voteStake",
        id: "weight",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 140 }}>
            <Text
              css={{
                fontWeight: 600,
                color: "$hiContrast",
                whiteSpace: "nowrap",
              }}
              size="2"
            >
              {formatVoteStake(row.original.voteStake)}
            </Text>
          </Box>
        ),
      },
      {
        Header: "Timestamp",
        accessor: "timestamp",
        id: "timestamp",
        Cell: ({ row }) => {
          if (row.original.timestamp) {
            return (
              <Text size="1" css={{ color: "$neutral11" }}>
                {dayjs
                  .unix(row.original.timestamp)
                  .format("MMM D YYYY, h:mm a")}
              </Text>
            );
          } else {
            return (
              <Text size="1" css={{ color: "$neutral9" }}>
                N/A
              </Text>
            );
          }
        },
      },
      {
        Header: "Transaction",
        accessor: "transactionHash",
        id: "transaction",
        Cell: ({ row }) => (
          <Box
            css={{
              minWidth: 130,
              display: "flex",
              alignItems: "center",
              height: "100%",
            }}
          >
            {row.original.transactionHash ? (
              <TransactionBadge id={row.original.transactionHash} />
            ) : (
              <Text css={{ color: "$neutral9" }} size="2">
                N/A
              </Text>
            )}
          </Box>
        ),
      },
      {
        Header: "",
        id: "history",
        Cell: ({ row }) => (
          <Box
            css={{
              minWidth: 40,
              textAlign: "right",
              color: "$primary11",
              paddingRight: "$2",
            }}
          >
            <ExplorerTooltip content="See their voting history">
              <Box
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({
                    address: row.original.voter,
                    ensName: row.original.ensName,
                    voteStake: row.original.voteStake,
                  });
                }}
                css={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  color: "$neutral10",
                  "&:hover": {
                    color: "$primary11",
                    backgroundColor: "$primary3",
                    transform: "rotate(-15deg)",
                  },
                  transition: "color .2s, background-color .2s, transform .2s",
                }}
              >
                <Box
                  as={CounterClockwiseClockIcon}
                  css={{ width: 16, height: 16 }}
                />
              </Box>
            </ExplorerTooltip>
          </Box>
        ),
        disableSortBy: true,
      },
    ],
    [formatVoteStake, onSelect]
  );

  return (
    <Box css={{ display: "none", "@bp2": { display: "block" } }}>
      <DataTable
        data={votes}
        columns={columns}
        initialState={{
          pageSize,
          sortBy: [
            {
              id: "weight",
              desc: true,
            },
          ],
        }}
      />
    </Box>
  );
};
