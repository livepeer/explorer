/** A single voter's contribution to an on-chain computed poll tally. */
export type PollTallyVote = {
  voter: string;
  choice: "Yes" | "No";
  /** Stake behind the vote, in LPT (decimal string). */
  voteStake: string;
  /** Stake of this voter's delegators that voted themselves, in LPT. */
  nonVoteStake: string;
  registeredTranscoder: boolean;
};

/**
 * Stake-weighted poll results computed directly from chain state, mirroring the
 * subgraph's tally so it can stand in for `poll.tally` while indexing is behind.
 */
export type PollTally = {
  poll: string;
  /** Stake-weighted totals, in LPT (decimal strings). */
  tally: { yes: string; no: string };
  /** Total bonded stake used for participation, in LPT. */
  totalStake: string;
  votes: PollTallyVote[];
  /** Unix seconds the tally was computed at. */
  updatedAt: number;
};
