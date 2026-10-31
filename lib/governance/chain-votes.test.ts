import { withVoteTotals } from "./chain-votes";

describe("withVoteTotals", () => {
  const proposal = (id: string, forVotes: number) => ({
    id,
    forVotes,
    againstVotes: 0,
    abstainVotes: 0,
    title: `p${id}`,
  });

  it("uses the governor's totals over the subgraph's double-counted ones", () => {
    // The subgraph counted a delegator's 100 LPT twice: with them, and in
    // their orchestrator's weight.
    const out = withVoteTotals(
      [proposal("1", 1_100)],
      new Map([["1", { forVotes: 1_000, againstVotes: 0, abstainVotes: 0 }]])
    );
    expect(out[0].forVotes).toBe(1_000);
    expect(out[0].title).toBe("p1");
  });

  it("keeps the subgraph's figures for a proposal whose read failed", () => {
    const out = withVoteTotals([proposal("2", 500)], new Map());
    expect(out[0].forVotes).toBe(500);
  });
});
