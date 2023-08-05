export type Proposal = {
  id: string;
  proposer: string;
  voteStart: number;
  voteEnd: number;
  description: string;
};

export type ProposalState = {
  id: string;
  state: "Pending" | "Active" | "Canceled" | "Defeated" | "Succeeded" | "Queued" | "Expired" | "Executed" | "Unknown";
  quota: string;
  quorum: string;
  totalVoteSupply: string;
  votes: {
    against: string;
    for: string;
    abstain: string;
  };
};
