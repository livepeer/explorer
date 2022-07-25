export type UnbondingLock = {
  id: number;
  amount: string;
  withdrawRound: string;
};

export type L1Delegator = {
  delegateAddress: string;
  pendingStake: string;
  pendingFees: string;

  transcoderStatus: "not-registered" | "registered";

  unbondingLocks: UnbondingLock[];
  activeLocks: UnbondingLock[];
};
