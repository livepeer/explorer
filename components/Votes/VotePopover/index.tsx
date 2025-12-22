"use client";

import Spinner from "@components/Spinner";
import { Flex, Text } from "@livepeer/design-system";
import React from "react";

import { useInfuraVoterVotes } from "../../../hooks/TreasuryVotes/useInfuraVoterVotes";
import VoteDetail from "../VoteDetail";
import VoteModal from "../VoteModal";

interface VoterPopoverProps {
  voter: string;
  onClose: () => void;
}

const Index: React.FC<VoterPopoverProps> = ({ voter, onClose }) => {
  const { votes, isLoading } = useInfuraVoterVotes(voter);

  return (
    <VoteModal onClose={onClose}>
      {isLoading ? (
        <Flex
          css={{
            justifyContent: "center",
            alignItems: "center",
            height: "150px",
          }}
        >
          <Spinner />
        </Flex>
      ) : votes.length > 0 ? (
        votes.map((vote, idx) => (
          <VoteDetail key={vote.transactionHash ?? idx} vote={vote} />
        ))
      ) : (
        <Text
          css={{ color: "$neutral11", textAlign: "center", marginTop: "$4" }}
        >
          No votes found for this voter.
        </Text>
      )}
    </VoteModal>
  );
};

export default Index;
