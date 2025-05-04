import React from 'react';
import Image from 'next/image';
import { Box, Flex, Text, Link } from '@livepeer/design-system';
import ArbitrumIcon from '../../public/img/logos/arbitrum.png';
import { formatAddress } from '../../utils/formatAddress';
import { Vote, SUPPORT } from '../../lib/api/types/votes';

interface DesktopVoteTableProps {
  votes: Vote[];
  counts: { yes: number; no: number; abstain: number };
  formatWeight: (weight: string) => string;
  onSelect: (voter: string) => void;
}


export const DesktopVoteTable: React.FC<DesktopVoteTableProps> = ({ votes, counts, formatWeight, onSelect }) => (
  <Box css={{ display: 'none', '@bp2': { display: 'block' }, overflowX: 'auto' }}>
    <Text css={{ textAlign: 'center', fontSize: '$4', fontWeight: 500, color: '$white', mb: '$2' }}>
      Vote Results
    </Text>
    <Flex css={{ justifyContent: 'center', mb: '$4', fontWeight: 700, fontSize: '$3', color: '$white' }}>
      <Text css={{ mr: '$1', color: '$green9' }}>Yes ({counts.yes})</Text>
      <Text>|</Text>
      <Text css={{ mx: '$1', color: '$red9' }}>No ({counts.no})</Text>
      <Text>|</Text>
      <Text css={{ ml: '$1', color: '$yellow9' }}>Abstain ({counts.abstain})</Text>
    </Flex>

    <Text css={{ textAlign: 'center', fontSize: '$2', color: '$neutral11', mb: '$2' }}>
    Click on a vote to view a voter's proposal voting history.
    </Text>
    <Box as="table" css={{ width: '100%', borderCollapse: 'collapse' }}>
      <Box as="thead">
        <Box as="tr" css={{ backgroundColor: '$neutral4' }}>
          {['Voter', 'Support', 'Weight', 'Reason', 'Vote Txn'].map(label => (
            <Box key={label} as="th" css={{ textAlign: 'center', textTransform: 'uppercase', fontSize: '$1', color: '$neutral11', borderBottom: '1px solid $neutral5' }}>
              {label}
            </Box>
          ))}
        </Box>
      </Box>
      <Box as="tbody">
        {votes.map(vote => {
          const support = SUPPORT[vote.choiceID] || SUPPORT['2'];
          return (
            <Box
              key={vote.transactionHash || vote.voter}
              as="tr"
              css={{ backgroundColor: '$neutral3', cursor: 'pointer', position: 'relative', zIndex: 2, '&:hover': { backgroundColor: '$neutral4' }, '& > td': { padding: '$2' } }}
              onClickCapture={e => { if ((e.target as HTMLElement).closest('a')) return; e.stopPropagation(); onSelect(vote.voter); }}
            >
              <Box as="td" css={{ textAlign: 'center', color: '$white', borderBottom: '1px solid $neutral5' }}>
                <Link
                  href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
                  target="_blank"
                  css={{ color: '$green11', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  onClick={e => e.stopPropagation()}
                >
                  {formatAddress(vote.ensName ?? '') || formatAddress(vote.voter)}
                </Link>
              </Box>
              <Box as="td" css={{ textAlign: 'center', ...support.style, borderBottom: '1px solid $neutral5' }}>
                {support.text}
              </Box>
              <Box as="td" css={{ textAlign: 'center', color: '$white', borderBottom: '1px solid $neutral5' }}>
                {formatWeight(vote.weight)}
              </Box>
              <Box as="td" css={{ textAlign: 'center', color: '$neutral9', borderBottom: '1px solid $neutral5' }}>
                {vote.reason}
              </Box>
              <Box as="td" css={{ textAlign: 'center', borderBottom: '1px solid $neutral5', position: 'relative', zIndex: 5 }}>
                {vote.transactionHash ? (
                  <Link
                    href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
                    target="_blank"
                    onClickCapture={e => e.stopPropagation()}
                    css={{ display: 'inline-block', transition: 'transform 0.2s ease', zIndex: 9999, position: 'relative', '&:hover': { transform: 'scale(1.3)', zIndex: 9999 } }}
                  >
                    <Image src={ArbitrumIcon} alt="Arbitrum Icon" width={32} height={32} />
                  </Link>
                ) : (
                  <Text css={{ color: '$neutral9' }}>N/A</Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  </Box>
);