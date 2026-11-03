import { isActiveInRound } from "./active";

const NEVER =
  "57896044618658097711785492504343953926634992332820282019728792003956564819967";

describe("isActiveInRound", () => {
  it("is active from its activation round until it's deactivated", () => {
    expect(isActiveInRound("2467", NEVER, 4349)).toBe(true);
    expect(isActiveInRound("4349", NEVER, 4349)).toBe(true);
  });

  it("isn't active before activation", () => {
    expect(isActiveInRound("4350", NEVER, 4349)).toBe(false);
  });

  it("isn't active from its deactivation round on", () => {
    expect(isActiveInRound("2467", "4349", 4349)).toBe(false);
    expect(isActiveInRound("2467", "4350", 4349)).toBe(true);
  });

  it("isn't active without round data", () => {
    expect(isActiveInRound(null, NEVER, 4349)).toBe(false);
  });
});
