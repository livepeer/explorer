import { Box, Flex, Text } from "@livepeer/design-system";
import React from "react";

import { VoteTableProps } from "./DesktopVoteTable";
import { VoteView } from "./VoteItem";

export const MobileVoteCards: React.FC<VoteTableProps> = ({
  votes,
  counts,
  formatWeight,
  onSelect,
}) => (
  <Box css={{ display: "block", "@bp2": { display: "none" } }}>
    <Text
      css={{
        textAlign: "center",
        marginTop: "$2",
        fontSize: "$4",
        fontWeight: 500,
        color: "$white",
        marginBottom: "$2",
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
        marginTop: "$2",
        marginBottom: "$2",
      }}
    >
      <Text css={{ marginRight: "$1", color: "$green9" }}>
        Yes ({counts.yes})
      </Text>
      <Text>|</Text>
      <Text css={{ marginLeft: "$1", marginRight: "$1", color: "$red9" }}>
        No ({counts.no})
      </Text>
      <Text>|</Text>
      <Text css={{ marginLeft: "$1", color: "$yellow9" }}>
        Abstain ({counts.abstain})
      </Text>
    </Flex>

    <Text
      css={{
        textAlign: "center",
        fontSize: "$2",
        color: "$neutral11",
        marginBottom: "$2",
      }}
    >
      Click on a vote to view a voters proposal voting history.
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
