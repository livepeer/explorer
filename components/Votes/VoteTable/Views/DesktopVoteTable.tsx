import DataTable from "@components/Table";
import { formatTransactionHash } from "@lib/utils";
import { Badge, Box, Link, Text, Tooltip } from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import React, { useMemo } from "react";
import { Column } from "react-table";

import { Vote, VOTING_SUPPORT } from "../../../../lib/api/types/votes";

export interface VoteTableProps {
  votes: Vote[];
  formatWeight: (weight: string) => string;
  onSelect: (voter: { address: string; ensName?: string }) => void;
  pageSize?: number;
  totalPages?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export const DesktopVoteTable: React.FC<VoteTableProps> = ({
  votes,
  formatWeight,
  onSelect,
  pageSize = 10,
}) => {
  const columns = useMemo<Column<Vote>[]>(
    () => [
      {
        Header: "Voter",
        accessor: "ensName",
        id: "voter",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 120 }}>
            <Link
              href={`https://explorer.livepeer.org/accounts/${row.original.voter}/delegating`}
              target="_blank"
              css={{
                color: "$primary11",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Text
                css={{
                  fontWeight: 600,
                  color: "$primary11",
                  whiteSpace: "nowrap",
                }}
                size="2"
              >
                {row.original.ensName}
              </Text>
            </Link>
          </Box>
        ),
      },
      {
        Header: "Support",
        accessor: "choiceID",
        id: "support",
        Cell: ({ row }) => {
          const support =
            VOTING_SUPPORT[
              row.original.choiceID as keyof typeof VOTING_SUPPORT
            ] || VOTING_SUPPORT["2"];
          return (
            <Box css={{ minWidth: 80 }}>
              <Text
                css={{
                  whiteSpace: "nowrap",
                  ...support.style,
                }}
                size="2"
              >
                {support.text}
              </Text>
            </Box>
          );
        },
      },
      {
        Header: "Weight",
        accessor: "weight",
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
              {formatWeight(row.original.weight)}
            </Text>
          </Box>
        ),
        sortType: (rowA, rowB) => {
          return (
            parseFloat(rowA.original.weight) - parseFloat(rowB.original.weight)
          );
        },
      },
      {
        Header: "Reason",
        accessor: "reason",
        id: "reason",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 100 }}>
            <Text
              size="1"
              css={{
                color:
                  row.original.reason &&
                  row.original.reason.toLowerCase() === "no reason provided"
                    ? "$neutral9"
                    : "$hiContrast",
              }}
            >
              {row.original.reason}
            </Text>
          </Box>
        ),
      },
      {
        Header: "Vote Txn",
        accessor: "transactionHash",
        id: "transaction",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 130 }}>
            {row.original.transactionHash ? (
              <Link
                href={`https://arbiscan.io/tx/${row.original.transactionHash}#eventlog`}
                target="_blank"
                onClickCapture={(e) => e.stopPropagation()}
                css={{
                  display: "inline-block",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.1)" },
                }}
              >
                <Badge css={{ cursor: "pointer" }} variant="primary" size="1">
                  {formatTransactionHash(row.original.transactionHash)}
                  <Box
                    css={{ marginLeft: "$1", width: 14, height: 14 }}
                    as={ArrowTopRightIcon}
                  />
                </Badge>
              </Link>
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
          <Box css={{ minWidth: 40, textAlign: "right", color: "$primary11" }}>
            <Tooltip content="See their voting history">
              <Box
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({
                    address: row.original.voter,
                    ensName: row.original.ensName,
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
            </Tooltip>
          </Box>
        ),
        disableSortBy: true,
      },
    ],
    [formatWeight, onSelect]
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
