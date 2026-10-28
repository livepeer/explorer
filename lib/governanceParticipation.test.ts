import {
  ActivationEvent,
  buildActiveWindows,
  calculateParticipation,
  DeactivationEvent,
  GovernanceHistory,
} from "./governanceParticipation";

const activation = (
  round: number,
  block: number,
  log = 1,
  hash = "0xff"
): ActivationEvent => ({
  id: `${hash}-${log}`,
  activationRound: String(round),
  transaction: { blockNumber: String(block) },
});
const deactivation = (
  round: number,
  block: number,
  log = 1,
  hash = "0xaa"
): DeactivationEvent => ({
  id: `${hash}-${log}`,
  deactivationRound: String(round),
  transaction: { blockNumber: String(block) },
});

describe("active windows", () => {
  it("keeps a reactivation after a same-round deactivation open", () => {
    expect(
      buildActiveWindows(
        [activation(200, 20, 12), activation(100, 10)],
        [deactivation(200, 20, 2)]
      )
    ).toEqual([
      { start: 100, end: 200 },
      { start: 200, end: Infinity },
    ]);
  });

  it("discards activation canceled before it takes effect", () => {
    expect(
      buildActiveWindows([activation(200, 20, 2)], [deactivation(200, 20, 12)])
    ).toEqual([]);
  });

  it("honors the last change across transactions and blocks in the same round", () => {
    expect(
      buildActiveWindows(
        [activation(200, 21), activation(200, 20)],
        [deactivation(200, 20, 12)]
      )
    ).toEqual([{ start: 200, end: Infinity }]);
  });

  it("preserves the first activation when an activation repeats", () => {
    expect(
      buildActiveWindows(
        [activation(100, 10), activation(150, 15)],
        [deactivation(200, 20)]
      )
    ).toEqual([{ start: 100, end: 200 }]);
  });

  it("ignores unmatched and repeated deactivations without inventing history", () => {
    expect(
      buildActiveWindows(
        [activation(100, 10)],
        [deactivation(80, 8), deactivation(200, 20), deactivation(250, 25)]
      )
    ).toEqual([{ start: 100, end: 200 }]);
  });
});

describe("participation while active", () => {
  const history: GovernanceHistory = {
    activations: [activation(10, 1), activation(30, 3)],
    deactivations: [deactivation(20, 2), deactivation(35, 4)],
    proposals: [
      { id: "before", voteStart: "8" },
      { id: "activation", voteStart: "9" },
      { id: "inside", voteStart: "18" },
      { id: "deactivation", voteStart: "19" },
      { id: "gap", voteStart: "25" },
      { id: "reactivation", voteStart: "29" },
      { id: "end", voteStart: "34" },
    ],
    votes: [
      { id: "1", proposal: { id: "activation" } },
      { id: "2", proposal: { id: "inside" } },
      { id: "3", proposal: { id: "deactivation" } },
      { id: "4", proposal: { id: "gap" } },
      { id: "5", proposal: { id: "unknown" } },
      { id: "duplicate", proposal: { id: "inside" } },
    ],
  };

  it("includes voting that opens on activation and excludes deactivation and gaps", () => {
    expect(calculateParticipation(history, "40")).toEqual({
      voted: 2,
      total: 3,
    });
  });

  it("keeps a proposal pending through its snapshot round", () => {
    expect(calculateParticipation(history, "9")).toEqual({
      voted: 0,
      total: 0,
    });
    expect(calculateParticipation(history, "10")).toEqual({
      voted: 1,
      total: 1,
    });
    expect(calculateParticipation(history, "29")).toEqual({
      voted: 2,
      total: 2,
    });
    expect(calculateParticipation(history, "30")).toEqual({
      voted: 2,
      total: 3,
    });
  });

  it("counts proposals after a same-round reactivation", () => {
    expect(
      calculateParticipation(
        {
          ...history,
          activations: [activation(10, 1), activation(20, 2, 12)],
          deactivations: [deactivation(20, 2, 2)],
        },
        "40"
      )
    ).toEqual({ voted: 4, total: 6 });
  });

  it("reports zero proposals for an orchestrator that was never active", () => {
    expect(
      calculateParticipation({ ...history, activations: [] }, "40")
    ).toEqual({ voted: 0, total: 0 });
  });
});
