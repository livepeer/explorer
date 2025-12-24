export interface Vote {
  transactionHash: string;
  voter: string;
  choiceID: string;
  proposalId: string;
  weight: string;
  reason?: string;
  ensName?: string;
  endVote?: number;
  description?: string;
  proposalTitle?: string;
}

export const VOTING_SUPPORT = {
  "0": { text: "Against", style: { color: "$tomato11", fontWeight: 600 } },
  "1": { text: "For", style: { color: "$sky11", fontWeight: 600 } },
  "2": { text: "Abstain", style: { color: "$neutral11", fontWeight: 600 } },
} as const;

export type SupportKey = keyof typeof VOTING_SUPPORT;
