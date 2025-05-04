'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Heading, Text, Link } from '@livepeer/design-system';
import ArbitrumIcon from '../../public/img/logos/arbitrum.png';
import { SUPPORT, Vote } from '../../lib/api/types/votes';
import { formatAddress } from '../../utils/formatAddress';

const lptFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatLpt(w: string) {
  return `${lptFormatter.format(parseFloat(w) / 1e18)} LPT`;
}

interface VoteDetailItemProps {
  vote: Vote;
}

export const VoteDetailItem: React.FC<VoteDetailItemProps> = ({ vote }) => {
  const support = SUPPORT[vote.choiceID] || SUPPORT['2'];
  return (
    <Box
      css={{
        backgroundColor: '$neutral4',
        padding: '$4',
        borderRadius: '$2',
        marginTop: '$2',
      }}
    >
      <Heading as="h2" css={{ fontSize: '$3', mb: '$2', color: '$white' }}>
      <Link
    href={`https://explorer.livepeer.org/treasury/${vote.proposalId}`}
    target="_blank"
    css={{ color: '$green11', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
  >
        {vote.proposalTitle}
        </Link>
      </Heading>

      <Text css={{ mb: '$1' }}>
        <Text as="span" css={{ color: '$white', fontWeight: 600 }}>Proposal ID:</Text>{' '}
        <Text as="span" css={{ color: '$neutral11' }}>
          {formatAddress(vote.proposalId)}
        </Text>
      </Text>

      <Text css={{ mb: '$1', display: 'inline-flex', alignItems: 'center' }}>
        <Text as="span" css={{ color: '$white', fontWeight: 600, marginRight: '$1' }}>
          Support:
        </Text>
        <Text as="span" css={{ color: '$neutral11', ...support.style }}>
          {support.text}
        </Text>
      </Text>


      <Text css={{ mb: '$1' }}>
        <Text as="span" css={{ color: '$white', fontWeight: 600 }}>Weight:</Text>{' '}
        <Text as="span" css={{ color: '$neutral11' }}>
          {formatLpt(vote.weight)}
        </Text>
      </Text>

      <Text css={{ mb: '$1' }}>
        <Text as="span" css={{ color: '$white', fontWeight: 600 }}>Reason:</Text>{' '}
        <Text as="span" css={{ color: '$neutral11' }}>
          {vote.reason || 'No reason provided'}
        </Text>
      </Text>

      <Box css={{ textAlign: 'start', mt: '$2' }}>
        {vote.transactionHash ? (
          <Link
            href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
            target="_blank"
            onClickCapture={e => e.stopPropagation()}
            css={{ display: 'inline-block', transition: 'transform 0.2s ease', '&:hover': { transform: 'scale(1.3)' } }}
          >
            <Image src={ArbitrumIcon} alt="Arbitrum Icon" width={24} height={24} />
          </Link>
        ) : (
          <Text css={{ color: '$neutral9' }}>N/A</Text>
        )}
      </Box>
    </Box>
  );
};