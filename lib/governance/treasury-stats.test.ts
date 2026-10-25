import type { ProposalAction } from "./actions";
import { treasuryStats } from "./treasury-stats";

const ask = (amount: number): ProposalAction[] => [
  { kind: "lptTransfer", to: "0xabc", amount },
];

describe("treasuryStats", () => {
  it("pays out executed proposals and counts the approval rate", () => {
    const s = treasuryStats([
      { actions: ask(100), state: 7 }, // executed
      { actions: ask(50), state: 7 }, // executed
      { actions: ask(30), state: 4 }, // passed, not yet executed
      { actions: ask(999), state: 3 }, // defeated
    ]);
    expect(s.paidOut).toBe(150);
    expect(s.passed).toBe(3);
    expect(s.decided).toBe(4);
  });

  it("sums what's still up for a vote", () => {
    const s = treasuryStats([
      { actions: ask(25), state: 1 }, // active
      { actions: ask(10), state: 0 }, // pending
      { actions: ask(5), state: 7 },
    ]);
    expect(s.upForVote).toBe(35);
    expect(s.decided).toBe(1);
  });

  it("leaves out canceled proposals and ones whose state hasn't loaded", () => {
    const s = treasuryStats([
      { actions: ask(40), state: 2 }, // canceled
      { actions: ask(60), state: undefined },
    ]);
    expect(s).toEqual({ paidOut: 0, passed: 0, decided: 0, upForVote: 0 });
  });

  it("counts a passed proposal that isn't a plain LPT request, at 0 LPT", () => {
    const s = treasuryStats([
      {
        actions: [{ kind: "call", target: "0x1", value: 0, selector: null }],
        state: 7,
      },
    ]);
    expect(s).toMatchObject({ paidOut: 0, passed: 1, decided: 1 });
  });
});
