import React from "react";
import { Flex, Text, Box } from "@livepeer/design-system";
import { VoteTableProps } from "./DesktopVoteTable";
import { VoteView } from "./VoteItem";

interface MobileVoteCardsProps extends VoteTableProps {}

export const MobileVoteCards: React.FC<MobileVoteCardsProps> = ({
  votes,
  counts,
  formatWeight,
  onSelect,
}) => (
  <Box css={{ display: "block", "@bp2": { display: "none" } }}>
    <Text
      css={{
        textAlign: "center",
        mt: "$2",
        fontSize: "$4",
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
        fontWeight: 700,
        fontSize: "$3",
        color: "$white",
        mt: "$2",
        mb: "$2",
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
      Click on a vote to view a voter's proposal voting history.
    </Text>

    {votes.map((vote) => {
      return (
        <VoteView
          key={vote.voter}
          vote={vote}
          onSelect={onSelect}
          formatWeight={formatWeight}
          isMobile={true}
        />
      );
    })}
  </Box>
);

