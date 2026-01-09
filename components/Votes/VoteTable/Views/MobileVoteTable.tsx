import { Box, Button, Flex, Text } from "@livepeer/design-system";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
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
        Click on a vote to view a voter&apos;s proposal voting history.
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
        <Flex
          css={{
            marginTop: "$4",
            justifyContent: "center",
            alignItems: "center",
            gap: "$4",
          }}
        >
          <Button
            size="1"
            disabled={currentPage === 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            css={{
              display: "flex",
              alignItems: "center",
              gap: "$1",
              color: currentPage === 1 ? "$neutral8" : "$white",
            }}
          >
            <ArrowLeftIcon /> Previous
          </Button>
          <Text css={{ fontSize: "$1", color: "$neutral11" }}>
            Page {currentPage} of {totalPages}
          </Text>
          <Button
            size="1"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            css={{
              display: "flex",
              alignItems: "center",
              gap: "$1",
              color: currentPage === totalPages ? "$neutral8" : "$white",
            }}
          >
            Next <ArrowRightIcon />
          </Button>
        </Flex>
      )}
    </Box>
  );
};
