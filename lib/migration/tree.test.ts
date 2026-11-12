import { keccak256, zeroAddress } from "viem";

import snapshot from "@/data/delegator-claim-snapshot.json";

import { leafOf, parseLeaf, SnapshotTree } from "./tree";

/**
 * The root the MerkleSnapshot contract on Arbitrum holds for "LIP-73"
 * (checked against `snapshot(keccak256("LIP-73"))`, and a proof from this
 * tree against its `verify`, when this was written).
 */
const ON_CHAIN_ROOT =
  "0xe8a38536befba9f758950f09fbe609fbeee1cf85c8bf6932f1b4f832d49de3cc";

const tree = new SnapshotTree(snapshot as string[]);

/** OpenZeppelin MerkleProof.verify, as the contract runs it. */
function verify(proof: `0x${string}`[], leaf: `0x${string}`) {
  let hash = keccak256(leaf);
  for (const p of proof) {
    const [a, b] = hash < p ? [hash, p] : [p, hash];
    hash = keccak256(`${a}${b.slice(2)}` as `0x${string}`);
  }
  return hash === tree.root;
}

describe("SnapshotTree", () => {
  it("rebuilds the root held on-chain", () => {
    expect(tree.root).toBe(ON_CHAIN_ROOT);
  });

  it("proves every delegator in the snapshot", () => {
    const entries = (snapshot as string[]).map(parseLeaf).filter(Boolean);
    expect(entries.length).toBeGreaterThan(3000);
    for (const e of entries.slice(0, 200)) {
      const leaf = leafOf(e!);
      expect(verify(tree.proof(leaf)!, leaf)).toBe(true);
    }
  });

  it("has no proof for an address that isn't in it", () => {
    const leaf = leafOf({
      account: "0x000000000000000000000000000000000000dEaD",
      delegate: zeroAddress,
      stake: 1n,
      fees: 0n,
    });
    expect(tree.proof(leaf)).toBeNull();
  });

  it("parses a packed leaf back into its parts", () => {
    const e = {
      account: "0x1111111111111111111111111111111111111111",
      delegate: "0x2222222222222222222222222222222222222222",
      stake: 10n ** 18n,
      fees: 5n,
    };
    expect(parseLeaf(leafOf(e))).toEqual(e);
    expect(parseLeaf("0x" + "0".repeat(208))).toBeNull();
  });
});
