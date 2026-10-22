import { treasuryPace } from "./treasury-model";

describe("treasuryPace", () => {
  const now = 1_000_000;

  it("projects when the ceiling is reached at the current cut", () => {
    const p = treasuryPace(
      { balance: 400_000, ceiling: 750_000, nextCut: 0.1 },
      50_000,
      80_000,
      now
    );
    expect(p).toEqual({
      perRound: 5_000,
      full: false,
      rounds: 70,
      fullAt: now + 70 * 80_000,
    });
  });

  it("says full at or past the ceiling", () => {
    expect(
      treasuryPace(
        { balance: 750_000, ceiling: 750_000, nextCut: 0 },
        50_000,
        80_000,
        now
      ).full
    ).toBe(true);
  });

  it("has no date when nothing is paid in", () => {
    expect(
      treasuryPace(
        { balance: 100, ceiling: 750_000, nextCut: 0 },
        50_000,
        80_000,
        now
      )
    ).toEqual({ perRound: 0, full: false, rounds: null });
  });
});
