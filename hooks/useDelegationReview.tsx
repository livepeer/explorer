import { AccountQueryResult } from "apollo";
import { useMemo } from "react";

type Delegator = NonNullable<AccountQueryResult["data"]>["delegator"];
type CurrentRound = NonNullable<
  NonNullable<AccountQueryResult["data"]>["protocol"]
>["currentRound"];

export const useDelegationReview = ({
  action,
  delegator,
  currentRound,
}: {
  action: "delegate" | "undelegate" | "transfer";
  delegator?: Delegator | null;
  currentRound?: CurrentRound | null;
}) => {
  const warnings = useMemo(() => {
    const list: string[] = [];

    // Safety check
    if (!delegator || !currentRound) return list;

    const isDelegated =
      delegator?.bondedAmount && delegator?.bondedAmount !== "0";

    const lastClaimRound = delegator?.lastClaimRound?.id
      ? parseInt(delegator.lastClaimRound.id, 10)
      : 0;

    // Handle currentRound being an object or number. Types suggest it's likely an object with ID.
    const currentRoundNum = currentRound?.id
      ? parseInt(currentRound.id, 10)
      : 0;

    // Logic: Warn ONLY if lastClaimRound == currentRound
    const isCurrentRoundClaim = lastClaimRound === currentRoundNum;

    if (
      isDelegated &&
      (action === "undelegate" || action === "transfer") &&
      isCurrentRoundClaim
    ) {
      list.push(
        "You will lose all rewards for the current round if you proceed."
      );
    }

    return list;
  }, [action, delegator, currentRound]);

  return {
    warnings,
  };
};
