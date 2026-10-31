import { encodePacked, type Hex, keccak256 } from "viem";

/**
 * The LIP-73 delegator snapshot taken when Livepeer moved from Ethereum to
 * Arbitrum: one leaf per delegator, `abi.encodePacked(delegator, delegate,
 * stake, fees)`. A delegator claims on Arbitrum by proving their leaf is in
 * the tree whose root the MerkleSnapshot contract holds.
 *
 * Built like the snapshot's own tool (livepeer/merkle-earnings-cli): leaves
 * hashed, deduplicated and sorted, then paired level by level with each
 * pair sorted before hashing (OpenZeppelin's MerkleProof convention); an
 * odd element out moves up unchanged.
 */

export type SnapshotEntry = {
  account: string;
  delegate: string;
  /** LPT at the snapshot, wei. */
  stake: bigint;
  /** ETH at the snapshot, wei. */
  fees: bigint;
};

/** A leaf as packed in the snapshot: 20 + 20 + 32 + 32 bytes. */
export function parseLeaf(leaf: string): SnapshotEntry | null {
  const h = leaf.replace(/^0x/, "").toLowerCase();
  if (h.length !== 208 || /^0+$/.test(h)) return null;
  return {
    account: `0x${h.slice(0, 40)}`,
    delegate: `0x${h.slice(40, 80)}`,
    stake: BigInt(`0x${h.slice(80, 144)}`),
    fees: BigInt(`0x${h.slice(144, 208)}`),
  };
}

export function leafOf(e: SnapshotEntry): Hex {
  return encodePacked(
    ["address", "address", "uint256", "uint256"],
    [e.account as Hex, e.delegate as Hex, e.stake, e.fees]
  );
}

const compare = (a: Hex, b: Hex) => (a < b ? -1 : a > b ? 1 : 0);

/** Hash a pair in sorted order; a lone element passes up as it is. */
function combine(a: Hex | undefined, b: Hex | undefined): Hex {
  if (!a) return b!;
  if (!b) return a;
  const [x, y] = compare(a, b) <= 0 ? [a, b] : [b, a];
  return keccak256(`${x}${y.slice(2)}` as Hex);
}

export class SnapshotTree {
  private readonly layers: Hex[][];

  constructor(leaves: readonly string[]) {
    // Hex strings of the same length sort like their bytes.
    const hashed = [
      ...new Set(
        leaves.filter(Boolean).map((l) => keccak256(l as Hex).toLowerCase())
      ),
    ].sort(compare as (a: string, b: string) => number) as Hex[];
    const layers: Hex[][] = [hashed];
    while (layers[layers.length - 1].length > 1) {
      const level = layers[layers.length - 1];
      const next: Hex[] = [];
      for (let i = 0; i < level.length; i += 2)
        next.push(combine(level[i], level[i + 1]));
      layers.push(next);
    }
    this.layers = layers;
  }

  get root(): Hex {
    return this.layers[this.layers.length - 1][0];
  }

  /** The proof for a leaf, or null when it isn't in the tree. */
  proof(leaf: Hex): Hex[] | null {
    let idx = this.layers[0].indexOf(keccak256(leaf).toLowerCase() as Hex);
    if (idx === -1) return null;
    const proof: Hex[] = [];
    for (const layer of this.layers) {
      const pair = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (pair < layer.length) proof.push(layer[pair]);
      idx = Math.floor(idx / 2);
    }
    return proof;
  }
}
