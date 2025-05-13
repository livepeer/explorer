'use client';

import React from 'react';
import Spinner from '@components/Spinner';
import { Flex, Text } from '@livepeer/design-system';
import VoteModal from '../VoteModal';
import { VoteDetailItem } from './voteDetailItem';
import { useVoterVotes } from '../../../hooks/TreasuryVotes/useVoterVotes';

interface VoterPopoverProps {
  voter: string;
  onClose: () => void;
}

const Index: React.FC<VoterPopoverProps> = ({ voter, onClose }) => {
  const { votes, isLoading } = useVoterVotes(voter);

  return (
    <VoteModal onClose={onClose}>
      {isLoading ? (
        <Flex css={{ justifyContent: 'center', alignItems: 'center', height: '150px' }}>
          <Spinner />
        </Flex>
      ) : votes.length > 0 ? (
        votes.map((vote, idx) => (
          <VoteDetailItem key={vote.transactionHash ?? idx} vote={vote} />
        ))
      ) : (
        <Text css={{ color: '$neutral11', textAlign: 'center', mt: '$4' }}>
          No votes found for this voter.
        </Text>
      )}
    </VoteModal>
  );
};

export default Index;
