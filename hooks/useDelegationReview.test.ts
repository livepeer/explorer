import { getDelegationWarning } from "./useDelegationReview";

describe("getDelegationWarning", () => {
  it("warns for rebonding from an unbonded lock when that delegate has not called reward", () => {
    const warning = getDelegationWarning({
      delegator: {
        bondedAmount: "0",
        delegate: null,
      } as never,
      currentRound: { id: "101" } as never,
      action: "redelegateFromUndelegated",
      targetOrchestrator: {
        lastRewardRound: { id: "100" },
      },
    });

    expect(warning).toBe(
      "Moving stake to a different orchestrator will forfeit rewards and fees for the current round."
    );
  });

  it("does not warn once the unbonding-lock delegate has already called reward this round", () => {
    const warning = getDelegationWarning({
      delegator: {
        bondedAmount: "0",
        delegate: null,
      } as never,
      currentRound: { id: "101" } as never,
      action: "redelegateFromUndelegated",
      targetOrchestrator: {
        lastRewardRound: { id: "101" },
      },
    });

    expect(warning).toBeNull();
  });

  it("treats a missing lastRewardRound as not yet rewarded", () => {
    const warning = getDelegationWarning({
      delegator: {
        bondedAmount: "1",
        delegate: {},
      } as never,
      currentRound: { id: "101" } as never,
      action: "withdrawFees",
    });

    expect(warning).toBe(
      "Performing this action before your orchestrator calls reward will forfeit rewards and fees for the current round."
    );
  });
});
