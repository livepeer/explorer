import {
  isDelegatedWallet,
  isOfficialSafe,
  isSafeProxy,
  ownersOnly,
  sameSigners,
} from "./safe";

describe("ownersOnly", () => {
  it("allows no modules, or only Safe's 4337 module", () => {
    expect(ownersOnly([])).toBe(true);
    expect(ownersOnly(["0xA581C4A4DB7175302464FF3C06380BC3270B4037"])).toBe(
      true
    );
  });

  it("refuses any other module alongside", () => {
    expect(
      ownersOnly([
        "0xa581c4a4db7175302464ff3c06380bc3270b4037",
        "0x000000000000000000000000000000000000dEaD",
      ])
    ).toBe(false);
  });
});

describe("isOfficialSafe", () => {
  const slot = (addr: string) =>
    `0x${"0".repeat(24)}${addr.slice(2).toLowerCase()}`;

  it("accepts a proxy pointing at an official Safe implementation", () => {
    expect(
      isOfficialSafe(slot("0x3E5c63644E683549055b9Be8653de26E0B4CD36E"))
    ).toBe(true);
    expect(
      isOfficialSafe(slot("0x41675C099F32341bf84BFc5382aF534df5C7461a"))
    ).toBe(true);
  });

  it("refuses any other implementation, junk above the address, or nothing", () => {
    expect(
      isOfficialSafe(slot("0x000000000000000000000000000000000000dEaD"))
    ).toBe(false);
    expect(
      isOfficialSafe(
        `0x${"f".repeat(24)}3e5c63644e683549055b9be8653de26e0b4cd36e`
      )
    ).toBe(false);
    expect(isOfficialSafe(undefined)).toBe(false);
    expect(isOfficialSafe("0x")).toBe(false);
  });
});

describe("isSafeProxy", () => {
  // Safe 1.3.0's proxy, from its factory's proxyRuntimeCode().
  const proxy130 =
    "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033";

  it("accepts an official Safe proxy's code", () => {
    expect(isSafeProxy(proxy130)).toBe(true);
  });

  it("refuses other code, even one byte off, or none", () => {
    expect(isSafeProxy(`0x${proxy130.slice(2, -2)}34`)).toBe(false);
    expect(isSafeProxy("0x6080")).toBe(false);
    expect(isSafeProxy(undefined)).toBe(false);
  });
});

const A = "0x00000000000000000000000000000000000000Aa";
const B = "0x00000000000000000000000000000000000000bB";
const C = "0x00000000000000000000000000000000000000cC";

describe("sameSigners", () => {
  it("matches the same owners in any order and case, same threshold", () => {
    expect(
      sameSigners(
        { owners: [A, B], threshold: 2n },
        { owners: [B.toLowerCase(), A], threshold: 2n }
      )
    ).toBe(true);
  });

  it("refuses a different threshold", () => {
    expect(
      sameSigners(
        { owners: [A, B], threshold: 2n },
        { owners: [A, B], threshold: 1n }
      )
    ).toBe(false);
  });

  it("refuses an extra, missing or swapped owner", () => {
    const a = { owners: [A, B], threshold: 1n };
    expect(sameSigners(a, { owners: [A, B, C], threshold: 1n })).toBe(false);
    expect(sameSigners(a, { owners: [A], threshold: 1n })).toBe(false);
    expect(sameSigners(a, { owners: [A, C], threshold: 1n })).toBe(false);
  });

  it("refuses when either side isn't a Safe", () => {
    expect(sameSigners({ owners: [A], threshold: 1n }, null)).toBe(false);
    expect(sameSigners(undefined, { owners: [A], threshold: 1n })).toBe(false);
    expect(
      sameSigners({ owners: [], threshold: 0n }, { owners: [], threshold: 0n })
    ).toBe(false);
  });
});

describe("isDelegatedWallet", () => {
  it("recognises an EIP-7702 delegation", () => {
    // 0x8b57…ad12 on Arbitrum: a wallet delegated to a smart-account impl.
    expect(
      isDelegatedWallet("0xef0100612373d7003d694220f7800eeaf8e3924c0951d3")
    ).toBe(true);
  });

  it("isn't fooled by other code, or no code", () => {
    expect(isDelegatedWallet("0x")).toBe(false);
    expect(isDelegatedWallet(undefined)).toBe(false);
    expect(isDelegatedWallet("0x6080604052348015600f57600080fd5b")).toBe(false);
    // The prefix with extra bytes after the target isn't a delegation.
    expect(
      isDelegatedWallet("0xef0100612373d7003d694220f7800eeaf8e3924c0951d300")
    ).toBe(false);
  });
});
