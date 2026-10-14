import { proposalThresholds } from "./thresholds";

const base = {
  quorumVotes: 3_300_000,
  totalSupply: 10_000_000,
  quotaPpm: 500_000,
};

describe("proposalThresholds", () => {
  it("counts every vote towards quorum", () => {
    const t = proposalThresholds({
      ...base,
      forVotes: 2_000_000,
      againstVotes: 500_000,
      abstainVotes: 900_000,
    })!;
    expect(t.quorum).toBeCloseTo(33);
    expect(t.participation).toBeCloseTo(34);
    expect(t.quorumReached).toBe(true);
  });

  it("leaves abstentions out of the quota", () => {
    const t = proposalThresholds({
      ...base,
      forVotes: 600_000,
      againstVotes: 400_000,
      abstainVotes: 5_000_000,
    })!;
    expect(t.quota).toBe(50);
    expect(t.forShare).toBeCloseTo(60);
    expect(t.quotaMet).toBe(true);
  });

  it("needs more than the quota, not exactly it", () => {
    const t = proposalThresholds({
      ...base,
      forVotes: 500_000,
      againstVotes: 500_000,
      abstainVotes: 0,
    })!;
    expect(t.quotaMet).toBe(false);
    expect(t.quorumReached).toBe(false);
  });

  it("has no For share before any decisive vote", () => {
    const t = proposalThresholds({
      ...base,
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 10,
    })!;
    expect(t.forShare).toBeNull();
    expect(t.quotaMet).toBe(false);
  });

  it("is unknown without voting power", () => {
    expect(
      proposalThresholds({
        ...base,
        totalSupply: 0,
        forVotes: 1,
        againstVotes: 0,
        abstainVotes: 0,
      })
    ).toBeNull();
  });
});
