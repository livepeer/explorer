import { checkAddressEquality, formatAddress, fromWei, toWei } from "./web3";

describe("checkAddressEquality", () => {
  it("returns false for invalid addresses", () => {
    expect(checkAddressEquality("not-an-address", "0x123")).toBe(false);
  });

  it("compares valid addresses case-insensitively", () => {
    const addrLower = "0x00a0000000000000000000000000000000000001";
    const addrUpper =
      "0x00a0000000000000000000000000000000000001".toUpperCase();
    expect(checkAddressEquality(addrLower, addrUpper)).toBe(true);
  });

  it("returns false for different valid addresses", () => {
    const addr1 = "0x0000000000000000000000000000000000000001";
    const addr2 = "0x0000000000000000000000000000000000000002";
    expect(checkAddressEquality(addr1, addr2)).toBe(false);
  });
});

describe("fromWei", () => {
  it("converts string wei to ether string", () => {
    const oneEthWei = "1000000000000000000";
    expect(fromWei(oneEthWei)).toBe("1");
  });

  it("converts bigint wei to ether string", () => {
    const twoEthWei = 2000000000000000000n;
    expect(fromWei(twoEthWei)).toBe("2");
  });

  it("handles null/undefined gracefully", () => {
    expect(fromWei(null)).toBe("0");
    expect(fromWei(undefined)).toBe("0");
  });
});

describe("toWei", () => {
  it("converts ether number to bigint wei", () => {
    expect(toWei(1)).toBe(1000000000000000000n);
    expect(toWei(0.5)).toBe(500000000000000000n);
  });
});

describe("formatAddress", () => {
  it("shortens a normal ethereum address", () => {
    const addr = "0x1234567890abcdef1234567890abcdef12345678";
    const shortened = formatAddress(addr);

    // Implementation: replace address.slice(5, 39) with "…"
    // Note: slice(0,6) keeps 6 chars ("0x" + 4). slice(-4) keeps 4 chars.
    // Length check > 21.
    // 6 chars start + ... + 4 chars end.

    // Original implementation logic preserved in new file:
    // `${addr.slice(0, 6)}…${addr.slice(-4)}`

    expect(shortened).toBe("0x1234…5678");
  });

  it("returns empty string for falsy address", () => {
    expect(formatAddress(null)).toBe("");
  });
});
