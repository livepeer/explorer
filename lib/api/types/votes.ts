export interface Vote {
  transactionHash?: string;
  voter: string;
  choiceID: string;
  proposalId: string;
  weight: string;
  reason: string;
  ensName?: string;
  endVote?: number;
  description?: string;
  proposalTitle?: string;
}

export const SUPPORT = {
  '0': { text: 'No',     style: { color: '$red9',    fontWeight: 600 } },
  '1': { text: 'Yes',    style: { color: '$green9',  fontWeight: 600 } },
  '2': { text: 'Abstain',style: { color: '$yellow9', fontWeight: 600 } },
} as const;

export type SupportKey = keyof typeof SUPPORT;