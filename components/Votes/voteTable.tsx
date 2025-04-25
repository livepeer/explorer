"use client";

import React, { useState, useMemo, useCallback } from 'react';
import Spinner from '@components/Spinner';
import { useVotes } from '../../hooks/useVotes';
import { DesktopVoteTable } from './desktopVoteTable';
import { MobileVoteCards } from './mobileVoteCards';
import VoterPopover from './voterPopover';
import { Text, Flex } from '@livepeer/design-system';

interface VoteTableProps {
  proposalId: string;
}

const lptFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const VoteTable: React.FC<VoteTableProps> = ({ proposalId }) => {
  const { votes, loading } = useVotes(proposalId);
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);

  const counts = {
    yes: votes.filter(v => v.choiceID === '1').length,
    no: votes.filter(v => v.choiceID === '0').length,
    abstain: votes.filter(v => v.choiceID === '2').length,
  };

  const totalWeight = votes.reduce(
    (sum, v) => sum + parseFloat(v.weight),
    0
  );

  const formatWeight = useCallback(
    (w: string) =>
      `${lptFormatter.format(parseFloat(w) / 1e18)} LPT (${
        totalWeight > 0
          ? ((parseFloat(w) / totalWeight) * 100).toFixed(2)
          : '0'
      }%)`,
    [totalWeight] 
  );

  if (loading) return (
    <Flex css={{ justifyContent: 'center', alignItems: 'center', height: '150px' }}><Spinner /></Flex>
  );

  if (!votes.length) return (
    <Text css={{ textAlign: 'center', color: '$neutral11', mt: '$4' }}>
      No votes found for this proposal.
    </Text>
  );

  return (
    <>
      <DesktopVoteTable votes={votes} counts={counts} formatWeight={formatWeight} onSelect={setSelectedVoter} />
      <MobileVoteCards  votes={votes} counts={counts} formatWeight={formatWeight} onSelect={setSelectedVoter} />
      {selectedVoter && <VoterPopover voter={selectedVoter} onClose={() => setSelectedVoter(null)} />}
    </>
  );
};

export default VoteTable;
