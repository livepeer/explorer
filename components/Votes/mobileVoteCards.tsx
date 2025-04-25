import React from 'react';
import Image from 'next/image';
import { Card, Flex, Heading, Link, Text, Box } from '@livepeer/design-system';
import ArbitrumIcon from '../../public/img/logos/arbitrum.png';
import { formatAddress } from '../../utils/formatAddress';
import { Vote, SUPPORT } from './types';

interface MobileVoteCardsProps {
  votes: Vote[];
  counts: { yes: number; no: number; abstain: number };
  formatWeight: (weight: string) => string;
  onSelect: (voter: string) => void;
}


export const MobileVoteCards: React.FC<MobileVoteCardsProps> = ({ votes, counts, formatWeight, onSelect }) => (
  <Box css={{ display: 'block', '@bp2': { display: 'none' } }}>
    <Flex css={{ justifyContent: 'center', fontWeight: 700, fontSize: '$3', color: '$white', mt: '$2', mb: '$2' }}>
      <Text css={{ mr: '$1', color: '$green9' }}>Yes ({counts.yes})</Text>
      <Text>|</Text>
      <Text css={{ mx: '$1', color: '$red9' }}>No ({counts.no})</Text>
      <Text>|</Text>
      <Text css={{ ml: '$1', color: '$yellow9' }}>Abstain ({counts.abstain})</Text>
    </Flex>
    {votes.map(vote => {
      const support = SUPPORT[vote.choiceID] || SUPPORT['2'];
      return (
        <Card
          key={vote.transactionHash || vote.voter}
          css={{ p: '$4', mb: '$3', cursor: 'pointer', position: 'relative', zIndex: 2, bg: '$neutral3', '&:hover': { bg: '$neutral4' } }}
          onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) return; e.stopPropagation(); onSelect(vote.voter); }}
        >
          <Heading as="h4" css={{ fontSize: '$3', mb: '$2', color: '$green11' }}>
            {formatAddress(vote.ensName ?? '') || formatAddress(vote.voter)}
          </Heading>
          <Text css={{ display: 'flex', alignItems: 'center', mb: '$1' }}>
            <Text as="span" css={{ fontWeight: 600, mr: '$2' }}>Support:</Text>
            <Text as="span" css={support.style}>{support.text}</Text>
          </Text>
          <Text css={{ mb: '$1', color: '$white' }}>
            <Text as="span" css={{ fontWeight: 600 }}>Weight:</Text> {formatWeight(vote.weight)}
          </Text>
          <Text css={{ mb: '$1', color: '$neutral9' }}>
            <Text as="span" css={{ fontWeight: 600 }}>Reason:</Text> {vote.reason}
          </Text>
          <Box>
            {vote.transactionHash ? (
              <Link
                href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
                target="_blank"
                css={{ color: '$blue9', textDecoration: 'underline' }}
                onClick={e => e.stopPropagation()}
              >
                <Image src={ArbitrumIcon} alt="Arbitrum Icon" width={24} height={24} />
              </Link>
            ) : (
              <Text css={{ color: '$neutral9' }}>N/A</Text>
            )}
          </Box>
        </Card>
      );
    })}
  </Box>
);