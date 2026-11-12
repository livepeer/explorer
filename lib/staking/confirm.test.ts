import { PROTOCOL_CONTRACTS } from "@/lib/config";

import { confirmedContract } from "./confirm";

describe("confirmedContract", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("returns the pinned address when the registry agrees", () => {
    expect(
      confirmedContract(
        "BondingManager",
        PROTOCOL_CONTRACTS.BondingManager.toLowerCase()
      )
    ).toBe(PROTOCOL_CONTRACTS.BondingManager);
  });

  it("refuses an address the registry shouldn't return", () => {
    expect(
      confirmedContract(
        "BondingManager",
        "0x000000000000000000000000000000000000dEaD"
      )
    ).toBeUndefined();
  });

  it("waits for the registry", () => {
    expect(confirmedContract("LivepeerToken", undefined)).toBeUndefined();
  });
});
