export interface Vote {
    transactionHash?: string;
    weight: string;
    voter: string;
    choiceID: string;
    proposalId: string;
    reason: string;
    ensName?: string;
  }

  export const SUPPORT = {
    '0': { text: 'No',     style: { color: '$red9',    fontWeight: 600 } },
    '1': { text: 'Yes',    style: { color: '$green9',  fontWeight: 600 } },
    '2': { text: 'Abstain',style: { color: '$yellow9', fontWeight: 600 } },
  } as const