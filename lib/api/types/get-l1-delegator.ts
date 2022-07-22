export type L1Delegator = {
  delegateAddress: string;
  pendingStake: string;
  pendingFees: string;

  transcoderStatus: "not-registered" | "registered";

  unbondingLocks: number;
};
