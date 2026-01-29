import Pagination from "@components/Table/Pagination";
import { Box, Text } from "@livepeer/design-system";
import React from "react";

import { VoteTableProps } from "./DesktopVoteTable";
import { VoteView } from "./VoteItem";

export const MobileVoteCards: React.FC<VoteTableProps> = (props) => {
  const {
    votes,
    formatWeight,
    onSelect,
    totalPages = 0,
    currentPage = 1,
    onPageChange,
  } = props;

  return (
    <Box css={{ display: "block", "@bp2": { display: "none" } }}>
      <Text
        css={{
          textAlign: "center",
          fontSize: "$2",
          color: "$neutral11",
          marginTop: "$2",
          marginBottom: "$3",
        }}
      >
        View a voter&apos;s proposal voting history by clicking the history
        icon.
      </Text>

      {votes.map((vote) => {
        return (
          <VoteView
            key={vote.transactionHash || vote.voter.id}
            vote={vote}
            onSelect={onSelect}
            formatWeight={formatWeight}
            isMobile={true}
          />
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          canPrevious={currentPage > 1}
          canNext={currentPage < totalPages}
          onPrevious={() => onPageChange?.(currentPage - 1)}
          onNext={() => onPageChange?.(currentPage + 1)}
        />
      )}
    </Box>
  );
};
