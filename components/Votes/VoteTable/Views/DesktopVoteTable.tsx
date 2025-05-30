import React from "react";
import { Box, Flex, Text } from "@livepeer/design-system";
import { Vote } from "../../../../lib/api/types/votes";
import { VoteView } from "./VoteItem";

export interface VoteTableProps {
  votes: Vote[];
  counts: { yes: number; no: number; abstain: number };
  formatWeight: (weight: string) => string;
  onSelect: (voter: string) => void;
}

export const DesktopVoteTable: React.FC<VoteTableProps> = ({
  votes,
  counts,
  formatWeight,
  onSelect,
}) => (
  <Box
    css={{ display: "none", "@bp2": { display: "block" }, overflowX: "auto" }}
  >
    <Text
      css={{
        textAlign: "center",
        fontSize: "$3",
        fontWeight: 500,
        color: "$white",
        mb: "$2",
      }}
    >
      Vote Results
    </Text>
    <Flex
      css={{
        justifyContent: "center",
        mb: "$4",
        fontWeight: 700,
        fontSize: "$3",
        color: "$white",
      }}
    >
      <Text css={{ mr: "$1", color: "$green9" }}>Yes ({counts.yes})</Text>
      <Text>|</Text>
      <Text css={{ mx: "$1", color: "$red9" }}>No ({counts.no})</Text>
      <Text>|</Text>
      <Text css={{ ml: "$1", color: "$yellow9" }}>
        Abstain ({counts.abstain})
      </Text>
    </Flex>

    <Text
      css={{
        textAlign: "center",
        fontSize: "$2",
        color: "$neutral11",
        mb: "$2",
      }}
    >
      Click on a vote to view a voters proposal voting history.
    </Text>
    <Box as="table" css={{ width: "100%", borderCollapse: "collapse" }}>
      <Box as="thead">
        <Box as="tr" css={{ backgroundColor: "$neutral4" }}>
          {["Voter", "Support", "Weight", "Reason", "Vote Txn"].map((label) => (
            <Box
              key={label}
              as="th"
              css={{
                textAlign: "center",
                textTransform: "uppercase",
                fontSize: "$1",
                color: "$neutral11",
                borderBottom: "1px solid $neutral5",
                padding: "$2 $3",
              }}
            >
              {label}
            </Box>
          ))}
        </Box>
      </Box>
      <Box as="tbody">
        {votes.map((vote) => {
          return (
            <VoteView
              key={vote.choiceID}
              vote={vote}
              onSelect={onSelect}
              formatWeight={formatWeight}
              isMobile={false}
            />
          );
        })}
      </Box>
    </Box>
  </Box>
);
