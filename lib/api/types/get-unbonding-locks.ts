export type UnbondingLockInfo = {
  id: string;
  unbondingLockId: number;
  amount: string;
  withdrawRound: string;
  /**
   * The contract does not record which orchestrator a lock was unbonded from,
   * so this is the delegator's current delegate.
   */
  delegate: { id: string };
};

export type UnbondingLocks = {
  locks: UnbondingLockInfo[];
};
