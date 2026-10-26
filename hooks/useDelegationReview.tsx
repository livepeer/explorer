import { AccountQueryResult } from "apollo";
import { useMemo } from "react";

type Delegator = NonNullable<AccountQueryResult["data"]>["delegator"];
type CurrentRound = NonNullable<
  NonNullable<AccountQueryResult["data"]>["protocol"]
>["currentRound"];

type DelegationAction =
  | "delegate"
  | "undelegate"
  | "moveStake"
  | "redelegate"
  | "redelegateFromUndelegated"
  | "withdrawFees";

type DelegationReviewParams = {
  delegator?: Delegator | null;
  currentRound?: CurrentRound | null;
  action: DelegationAction;
};

export const getDelegationWarning = ({
  delegator,
  currentRound,
  action,
}: DelegationReviewParams) => {
  if (!delegator || !currentRound) {
    return null;
  }

  const currentRoundNum = Number(currentRound.id);
  const startRound = Number(delegator.startRound);
  const lastClaimRound = Number(delegator.lastClaimRound?.id ?? 0);

  // Earnings are claimed against the current delegate before stake is moved.
  const orchestratorToCheck = delegator.delegate;
  // New or fully unbonded stake starts earning next round. A claim that already
  // covered this round also means another action cannot forfeit more earnings.
  const hasStakeAtRisk =
    action !== "redelegateFromUndelegated" &&
    Number(delegator.bondedAmount) > 0 &&
    orchestratorToCheck?.active &&
    startRound > 0 &&
    startRound <= currentRoundNum &&
    lastClaimRound < currentRoundNum;

  if (!hasStakeAtRisk) {
    return null;
  }

  const orchestratorLastRewardRoundId =
    orchestratorToCheck?.lastRewardRound?.id;
  const orchestratorLastRewardRound = orchestratorLastRewardRoundId
    ? parseInt(orchestratorLastRewardRoundId, 10)
    : 0;
  // Per LIP-36, reward eligibility depends on reward(), while fees redeemed
  // later in the round can still be forfeited after reward() has been called.
  const orchestratorHasntCalledReward =
    orchestratorLastRewardRound < currentRoundNum;

  const actionDescription =
    action === "redelegate"
      ? "Rebonding"
      : action === "moveStake"
      ? "Moving stake to a different orchestrator"
      : "Performing this action";
  const stakeDescription =
    action === "redelegate"
      ? "your entire existing stake"
      : "your existing stake";

  if (orchestratorHasntCalledReward) {
    return `${actionDescription} before your current orchestrator calls reward will forfeit this round's LPT rewards on ${stakeDescription}. You may also forfeit fees earned later this round.`;
  }

  return `${actionDescription} may forfeit fees earned later this round on ${stakeDescription}.`;
};

export const useDelegationReview = ({
  delegator,
  currentRound,
  action,
}: DelegationReviewParams) => {
  const delegationWarning = useMemo(
    () =>
      getDelegationWarning({
        delegator,
        currentRound,
        action,
      }),
    [delegator, currentRound, action]
  );

  return {
    delegationWarning,
  };
};
