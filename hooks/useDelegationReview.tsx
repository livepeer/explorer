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

type ReviewOrchestrator = { lastRewardRound?: { id: string } | null } | null;

type DelegationReviewParams = {
  delegator?: Delegator | null;
  currentRound?: CurrentRound | null;
  action: DelegationAction;
  targetOrchestrator?: ReviewOrchestrator;
};

export const getDelegationWarning = ({
  delegator,
  currentRound,
  action,
  targetOrchestrator,
}: DelegationReviewParams) => {
  if (!delegator || !currentRound) {
    return null;
  }

  const isDelegated = delegator.bondedAmount && delegator.bondedAmount !== "0";
  const hasStakeAtRisk =
    action === "redelegateFromUndelegated"
      ? Boolean(targetOrchestrator)
      : Boolean(isDelegated);

  // Use an explicit orchestrator when the action concerns stake outside the
  // account's current delegate, such as rebonding from an unbonded lock.
  const orchestratorToCheck = targetOrchestrator || delegator.delegate;
  const orchestratorLastRewardRoundId =
    orchestratorToCheck?.lastRewardRound?.id;
  const orchestratorLastRewardRound = orchestratorLastRewardRoundId
    ? parseInt(orchestratorLastRewardRoundId, 10)
    : 0;
  const currentRoundNum = currentRound.id ? parseInt(currentRound.id, 10) : 0;

  // Per LIP-36: Warn if the relevant orchestrator hasn't called reward() yet
  // this round and the action can still affect stake that was delegated to it.
  const orchestratorHasntCalledReward =
    hasStakeAtRisk &&
    Boolean(orchestratorLastRewardRoundId) &&
    orchestratorLastRewardRound < currentRoundNum;

  if (!orchestratorHasntCalledReward) {
    return null;
  }

  switch (action) {
    case "redelegate":
      return "Rebonding will forfeit rewards and fees for the current round on your entire stake.";
    case "moveStake":
    case "redelegateFromUndelegated":
      return "Moving stake to a different orchestrator will forfeit rewards and fees for the current round.";
    default:
      return "Performing this action before your orchestrator calls reward will forfeit rewards and fees for the current round.";
  }
};

export const useDelegationReview = ({
  delegator,
  currentRound,
  action,
  targetOrchestrator,
}: DelegationReviewParams) => {
  const delegationWarning = useMemo(
    () =>
      getDelegationWarning({
        delegator,
        currentRound,
        action,
        targetOrchestrator,
      }),
    [delegator, currentRound, action, targetOrchestrator]
  );

  return {
    delegationWarning,
  };
};
