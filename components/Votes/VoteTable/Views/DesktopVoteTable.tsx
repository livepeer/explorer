import { ExplorerTooltip } from "@components/ExplorerTooltip";
import DataTable from "@components/Table";
import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import { formatTransactionHash } from "@lib/utils";
import { Badge, Box, Link, Text } from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import { TreasuryVote, TreasuryVoteSupport } from "apollo";
import React, { useMemo } from "react";
import { Column } from "react-table";

import { VoteReasonPopover } from "./VoteReasonPopover";

export type Vote = TreasuryVote & {
  ensName?: string;
  transactionHash?: string;
};

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
  console.log(votes);
  const columns = useMemo<Column<Vote>[]>(
    () => [
      {
        Header: "Voter",
        accessor: "ensName",
        id: "voter",
        Cell: ({ row }) => (
          <Box css={{ minWidth: 120 }}>
            <Link
              href={`https://explorer.livepeer.org/accounts/${row.original.voter.id}/delegating`}
              target="_blank"
              css={{
                color: "$hiContrast",
                textDecoration: "none",
                display: "inline-block",
                padding: "2px 8px",
                margin: "-2px -8px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "$neutral3",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                },
                "&:focus-visible": {
                  outline: "2px solid $primary11",
                  outlineOffset: "2px",
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Text
                css={{
                  fontWeight: 600,
                  color: "inherit",
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
        accessor: "support",
        id: "support",
        Cell: ({ row }) => {
          const support =
            VOTING_SUPPORT_MAP[row.original.support] ||
            VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];

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
        Cell: ({ row }) => {
          const reason = row.original.reason?.trim();
          const isEmpty =
            !reason || reason.toLowerCase() === "no reason provided";

          const isLongReason = reason && reason.length > 50;

          return (
            <Box
              css={{
                minWidth: 200,
                maxWidth: 400,
                paddingRight: "$3",
                paddingLeft: "$2",
              }}
            >
              {!isEmpty ? (
                isLongReason ? (
                  <VoteReasonPopover
                    reason={reason!}
                    voterName={row.original.ensName}
                  >
                    <Text
                      size="1"
                      css={{
                        color: "$hiContrast",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        cursor: "help",
                        textDecoration: "underline dotted",
                        textUnderlineOffset: "2px",
                        textDecorationColor: "$neutral8",
                        "&:hover": {
                          textDecorationColor: "$hiContrast",
                        },
                      }}
                    >
                      {reason}
                    </Text>
                  </VoteReasonPopover>
                ) : (
                  <Text
                    size="1"
                    css={{
                      color: "$hiContrast",
                      cursor: "default",
                    }}
                  >
                    {reason}
                  </Text>
                )
              ) : (
                <Text
                  size="1"
                  css={{
                    color: "$neutral9",
                  }}
                >
                  —
                </Text>
              )}
            </Box>
          );
        },
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
                  display: "inline-flex",
                  textDecoration: "none !important",
                  "&:hover > *": {
                    border: "1.5px solid $grass7 !important",
                    backgroundColor: "$grass3 !important",
                    color: "$grass11 !important",
                  },
                }}
              >
                <Badge
                  css={{
                    cursor: "pointer",
                    backgroundColor: "$neutral3",
                    color: "$neutral11",
                    border: "1px solid $neutral4",
                    transition:
                      "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                  }}
                  size="1"
                >
                  {formatTransactionHash(row.original.transactionHash)}
                  <Box
                    className="arrow-icon"
                    css={{
                      marginLeft: "$1",
                      width: 14,
                      height: 14,
                    }}
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
            <ExplorerTooltip content="See their voting history">
              <Box
                as="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect({
                    address: row.original.voter.id,
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
            </ExplorerTooltip>
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
