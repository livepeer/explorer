import { Address } from "viem";

export type RegisteredToVote = {
  registered: boolean;
  delegate: {
    address: Address;
    registered: boolean;
  };
};

export type VotingPower = {
  proposalThreshold: string;
  self: {
    address: Address;
    votes: string;
  };
  delegate?: {
    address: Address;
    votes: string;
  };
};

export type Proposal = {
  id: string;
  proposer: string;
  voteStart: number;
  voteEnd: number;
  description: string;
};

export type ProposalState = {
  id: string;
  state:
    | "Pending"
    | "Active"
    | "Canceled"
    | "Defeated"
    | "Succeeded"
    | "Queued"
    | "Expired"
    | "Executed"
    | "Unknown";
  quota: string;
  quorum: string;
  totalVoteSupply: string;
  votes: {
    against: string;
    for: string;
    abstain: string;
  };
};

export type ProposalVotingPower = {
  self: {
    address: Address;
    votes: string;
    hasVoted: boolean;
  };
  delegate?: {
    address: Address;
    votes: string;
    hasVoted: boolean;
  };
};
