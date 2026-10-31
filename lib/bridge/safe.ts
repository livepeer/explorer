import { type Hex, keccak256 } from "viem";

/** Reading a Safe's signers: enough to tell whether two are the same. */
export const safeSignersAbi = [
  {
    type: "function",
    name: "getOwners",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address[]" }],
  },
  {
    type: "function",
    name: "getThreshold",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

/** A Safe's enabled modules: each can move its funds without the owners. */
export const safeModulesAbi = [
  {
    type: "function",
    name: "getModulesPaginated",
    stateMutability: "view",
    inputs: [{ type: "address" }, { type: "uint256" }],
    outputs: [{ type: "address[]" }, { type: "address" }],
  },
] as const;

/** Where a Safe's module list starts. */
export const SAFE_SENTINEL = "0x0000000000000000000000000000000000000001";

/**
 * Modules that act only on the owners' signatures: Safe's own 4337 module,
 * which Safe{Wallet} enables on new Safes (v0.2.0 for EntryPoint v0.6,
 * v0.3.0 for v0.7; each checked on Ethereum and Arbitrum).
 */
const OWNER_ONLY_MODULES = new Set(
  [
    "0xa581c4A4DB7175302464fF3C06380BC3270b4037",
    "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
  ].map((a) => a.toLowerCase())
);

/** Whether a Safe's modules leave its owners alone in control. */
export function ownersOnly(modules: readonly string[]) {
  return modules.every((m) => OWNER_ONLY_MODULES.has(m.toLowerCase()));
}

/**
 * Safe's official implementations (the code every Safe proxy runs), each
 * checked on Ethereum and Arbitrum to report its VERSION. 1.0.0 and 1.2.0
 * exist only on Ethereum.
 */
const SAFE_SINGLETONS = new Set(
  [
    "0xb6029EA3B2c51D09a50B53CA8012FeEB05bDa35A", // 1.0.0
    "0x34CfAC646f301356fAa8B21e94227e3583Fe3F5F", // 1.1.1
    "0x6851D6fDFAfD08c0295C392436245E5bc78B0185", // 1.2.0
    "0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552", // 1.3.0
    "0x3E5c63644E683549055b9Be8653de26E0B4CD36E", // 1.3.0 L2
    "0x69f4D1788e39c87893C980c06EdF4b7f686e2938", // 1.3.0 (EIP-155)
    "0xfb1bffC9d739B8D520DaF37dF666da4C687191EA", // 1.3.0 L2 (EIP-155)
    "0x41675C099F32341bf84BFc5382aF534df5C7461a", // 1.4.1
    "0x29fcB43b46531BcA003ddC8FCB67FFE91900C762", // 1.4.1 L2
    "0xFf51A5898e281Db6DfC7855790607438dF2ca44b", // 1.5.0
    "0xEdd160fEBBD92E350D4D398fb636302fccd67C7e", // 1.5.0 L2
  ].map((a) => a.toLowerCase())
);

/**
 * The runtime code of Safe's official proxies, by keccak256: each one only
 * forwards every call to the implementation in its slot 0. 1.0.0 and 1.1.1
 * are read from their factories' proxyRuntimeCode() on Ethereum; 1.3.0 from
 * its factories on both networks; 1.4.1 and 1.5.0, whose factories don't
 * expose it, from proxies they created, the same on both networks.
 */
const SAFE_PROXY_CODE = new Set([
  "0xf8fffcb9b9c73fbc4ffb6dc52f0001fa998951e0d4177894b1b899f7732b6eaf", // 1.0.0
  "0xaea7d4252f6245f301e540cfbee27d3a88de543af8e49c5c62405d5499fab7e5", // 1.1.1
  "0xb89c1b3bdf2cf8827818646bce9a8f6e372885f8c55e5c07acbd307cb133b000", // 1.3.0
  "0xd7d408ebcd99b2b70be43e20253d6d92a8ea8fab29bd3be7f55b10032331fb4c", // 1.4.1
  "0x4e381985ca68b3e5d27b4425fa581c19cf33146d3f887a3cfca96f55528ea46f", // 1.5.0
]);

/**
 * Whether an address runs one of Safe's official proxies. Slot 0 alone
 * isn't proof: any contract can store a Safe implementation's address
 * there and answer getOwners however it likes.
 */
export function isSafeProxy(code: Hex | undefined) {
  return Boolean(code && SAFE_PROXY_CODE.has(keccak256(code)));
}

/**
 * Whether a Safe proxy runs official Safe code, from its storage slot 0
 * (where a Safe proxy keeps its implementation). With isSafeProxy, it
 * shows the address is a Safe. A contract that merely answers getOwners
 * and getThreshold could run anything.
 */
export function isOfficialSafe(slot0: string | undefined) {
  if (!slot0 || !/^0x[0-9a-f]{64}$/i.test(slot0)) return false;
  // The address sits in the low 20 bytes; the rest must be zero.
  if (!/^0x0{24}/i.test(slot0)) return false;
  return SAFE_SINGLETONS.has(`0x${slot0.slice(26).toLowerCase()}`);
}

export type SafeSigners = { owners: readonly string[]; threshold: bigint };

/**
 * Whether an address's code is an EIP-7702 delegation: a regular wallet
 * (its key still signs) that has pointed itself at contract code, which
 * leaves `0xef0100` and the 20-byte target as its code. The same key
 * controls the address on every network, so for bridging it's a wallet,
 * not a contract.
 */
export function isDelegatedWallet(code: string | undefined) {
  return Boolean(code && /^0xef0100[0-9a-f]{40}$/i.test(code));
}

/**
 * Whether a Safe at the same address on two networks is controlled the same
 * way: the same owners (any order) and the same threshold. Only then is
 * bridging to "the same address" safe: a Safe deployed there by someone
 * else, or with other owners, would hold the LPT out of reach.
 */
export function sameSigners(a?: SafeSigners | null, b?: SafeSigners | null) {
  if (!a || !b) return false;
  if (a.threshold !== b.threshold || a.threshold === 0n) return false;
  if (a.owners.length !== b.owners.length || !a.owners.length) return false;
  const set = new Set(a.owners.map((o) => o.toLowerCase()));
  return b.owners.every((o) => set.has(o.toLowerCase()));
}
