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

export const useDelegationReview = ({
  delegator,
  currentRound,
  action,
  targetOrchestrator,
}: {
  delegator?: Delegator | null;
  currentRound?: CurrentRound | null;
  action: DelegationAction;
  targetOrchestrator?: { lastRewardRound?: { id: string } | null } | null;
}) => {
  const delegationWarning = useMemo(() => {
    // Safety check
    if (!delegator || !currentRound) {
      return null;
    }

    const isDelegated =
      delegator.bondedAmount && delegator.bondedAmount !== "0";

    // Get orchestrator's last reward round
    // Use targetOrchestrator if provided (for moving stake), otherwise use current delegate
    const orchestratorToCheck = targetOrchestrator || delegator.delegate;
    const orchestratorLastRewardRound = orchestratorToCheck?.lastRewardRound?.id
      ? parseInt(orchestratorToCheck.lastRewardRound.id, 10)
      : 0;

    const currentRoundNum = currentRound.id ? parseInt(currentRound.id, 10) : 0;

    // Per LIP-36: Warn if orchestrator hasn't called reward() yet this round
    // This affects bond(), unbond(), rebond(), rebondFromUnbonded(), and withdrawFees()
    // Only warn if we have valid delegate data to avoid false positives
    const orchestratorHasntCalledReward =
      isDelegated &&
      orchestratorToCheck?.lastRewardRound?.id &&
      orchestratorLastRewardRound < currentRoundNum;

    if (!orchestratorHasntCalledReward) {
      return null;
    }

    // Action-specific warning messages
    switch (action) {
      case "redelegate":
        return "Rebonding will forfeit rewards and fees for the current round on your entire stake.";
      case "moveStake":
      case "redelegateFromUndelegated":
        return "Moving stake to a different orchestrator will forfeit rewards and fees for the current round.";
      default:
        return "Performing this action before your orchestrator calls reward will forfeit rewards and fees for the current round.";
    }
  }, [delegator, currentRound, action, targetOrchestrator]);

  return {
    delegationWarning,
  };
};
