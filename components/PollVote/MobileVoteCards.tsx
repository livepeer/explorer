import Pagination from "@components/Table/Pagination";
import { Box, Text } from "@livepeer/design-system";
import React from "react";
import { PollVoteTableProps } from "./DesktopVoteTable";
import { MobileVoteView } from "./MobileVoteView";

export const MobileVoteCards: React.FC<PollVoteTableProps> = (props) => {
  const {
    votes,
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
          <MobileVoteView
            key={vote.transactionHash || vote.voter}
            vote={vote}
            onSelect={onSelect}
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
