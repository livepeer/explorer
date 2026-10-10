import { TranscoderStatus } from "apollo";

import { getDelegationWarning } from "./useDelegationReview";

type ReviewParams = Parameters<typeof getDelegationWarning>[0];
type Delegator = NonNullable<ReviewParams["delegator"]>;

const currentRound = { __typename: "Round" as const, id: "101" };
const currentDelegate: NonNullable<Delegator["delegate"]> = {
  __typename: "Transcoder",
  id: "0x1111111111111111111111111111111111111111",
  active: true,
  status: TranscoderStatus.Registered,
  totalStake: "100",
  feeShare: "500000",
  rewardCut: "100000",
  ninetyDayVolumeETH: "1",
  lastRewardRound: { __typename: "Round", id: "100" },
};

const makeDelegator = (overrides: Partial<Delegator> = {}): Delegator => ({
  __typename: "Delegator",
  id: "0x2222222222222222222222222222222222222222",
  bondedAmount: "10",
  principal: "10",
  unbonded: "0",
  withdrawnFees: "0",
  startRound: "90",
  lastClaimRound: { __typename: "Round", id: "100" },
  delegate: currentDelegate,
  ...overrides,
});

const review = (overrides: Partial<ReviewParams> = {}) =>
  getDelegationWarning({
    delegator: makeDelegator(),
    currentRound,
    action: "withdrawFees",
    ...overrides,
  });

describe("getDelegationWarning", () => {
  it.each<ReviewParams["action"]>([
    "delegate",
    "undelegate",
    "moveStake",
    "redelegate",
    "withdrawFees",
  ])("warns about rewards and later fees before reward for %s", (action) => {
    const warning = review({ action });

    expect(warning).toContain("this round's LPT rewards");
    expect(warning).toContain("fees earned later this round");
  });

  it.each<ReviewParams["action"]>([
    "delegate",
    "undelegate",
    "moveStake",
    "redelegate",
    "withdrawFees",
  ])("still warns about later fees after reward for %s", (action) => {
    const warning = review({
      action,
      delegator: makeDelegator({
        delegate: { ...currentDelegate, lastRewardRound: currentRound },
      }),
    });

    expect(warning).toContain("fees earned later this round");
    expect(warning).not.toContain("LPT rewards");
  });

  it("checks the source orchestrator's reward status when moving stake", () => {
    expect(review({ action: "moveStake" })).toBe(
      "Moving stake to a different orchestrator before your current orchestrator calls reward will forfeit this round's LPT rewards on your existing stake. You may also forfeit fees earned later this round."
    );
  });

  it("does not warn about rewards when the source has already rewarded", () => {
    expect(
      review({
        action: "moveStake",
        delegator: makeDelegator({
          delegate: { ...currentDelegate, lastRewardRound: currentRound },
        }),
      })
    ).toBe(
      "Moving stake to a different orchestrator may forfeit fees earned later this round on your existing stake."
    );
  });

  it("explains that rebonding affects the entire existing stake", () => {
    expect(review({ action: "redelegate" })).toContain(
      "your entire existing stake"
    );
  });

  it.each<ReviewParams["action"]>([
    "delegate",
    "redelegateFromUndelegated",
    "withdrawFees",
  ])("does not warn for fully unbonded stake during %s", (action) => {
    expect(
      review({
        action,
        delegator: makeDelegator({
          bondedAmount: "0",
          startRound: "0",
          delegate: null,
        }),
      })
    ).toBeNull();
  });

  it("does not warn about pending stake that starts earning next round", () => {
    expect(
      review({
        action: "delegate",
        delegator: makeDelegator({ startRound: "102" }),
      })
    ).toBeNull();
  });

  it("warns once pending stake starts earning in the current round", () => {
    expect(
      review({ delegator: makeDelegator({ startRound: "101" }) })
    ).toContain("LPT rewards");
  });

  it("does not warn when earnings have already been claimed this round", () => {
    expect(
      review({
        delegator: makeDelegator({ lastClaimRound: currentRound }),
      })
    ).toBeNull();
  });

  it("does not warn for an inactive orchestrator", () => {
    expect(
      review({
        delegator: makeDelegator({
          delegate: { ...currentDelegate, active: false },
        }),
      })
    ).toBeNull();
  });

  it("treats a missing lastRewardRound as not yet rewarded", () => {
    expect(
      review({
        delegator: makeDelegator({
          delegate: { ...currentDelegate, lastRewardRound: null },
        }),
      })
    ).toContain("LPT rewards");
  });

  it("handles a delegator with no prior earnings claim", () => {
    expect(
      review({ delegator: makeDelegator({ lastClaimRound: null }) })
    ).toContain("LPT rewards");
  });

  it("does not warn before delegator data has loaded", () => {
    expect(review({ delegator: undefined })).toBeNull();
  });

  it("does not warn before the current round has loaded", () => {
    expect(review({ currentRound: undefined })).toBeNull();
  });
});
