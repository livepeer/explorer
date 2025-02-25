// https://github.com/livepeer/merkle-earnings-cli/blob/master/src/tree/index.ts
import { ethers, solidityPacked, keccak256, AbiCoder, hexlify } from "ethers";
import { type Address } from "viem";

export interface IMerkleTree {
  elements: Buffer[];
  layers: Buffer[][];
}

export interface IDelegator {
  delegator: Address;
  pendingStake: bigint;
  pendingFees: bigint;
}

export class MerkleTree implements IMerkleTree {
  elements: Buffer[];
  layers: Buffer[][];

  constructor(elements: string[]) {
    // Filter empty strings and hash elements
    this.elements = elements
      .filter((el) => el)
      .map((el) => Buffer.from(keccak256(el).slice(2), "hex"));

    // Deduplicate elements
    this.elements = this.bufDedup(this.elements);
    // Sort elements
    this.elements.sort(Buffer.compare);

    // Create layers
    this.layers = this.getLayers(this.elements);
  }

  getLayers(elements: Buffer[]): Buffer[][] {
    if (elements.length === 0) {
      return [[Buffer.from("")]];
    }

    const layers: Buffer[][] = [];
    layers.push(elements);

    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(this.getNextLayer(layers[layers.length - 1]));
    }

    return layers;
  }

  getNextLayer(elements: Buffer[]): Buffer[] {
    return elements.reduce<Buffer[]>((layer, el, idx, arr) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(this.combinedHash(el, arr[idx + 1]));
      }
      return layer;
    }, []);
  }

  combinedHash(first: Buffer, second: Buffer): Buffer {
    if (!first) {
      return second;
    }
    if (!second) {
      return first;
    }

    return Buffer.from(
      keccak256(this.sortAndConcat(first, second)).slice(2),
      "hex"
    );
  }

  getRoot(): Buffer {
    return this.layers[this.layers.length - 1][0];
  }

  getHexRoot(): string {
    return "0x" + this.getRoot().toString("hex");
  }

  getProof(el: string): Buffer[] {
    const element = Buffer.from(keccak256(el).slice(2), "hex");
    let idx = this.bufIndexOf(element, this.elements);

    if (idx === -1) {
      throw new Error("Element does not exist in Merkle tree");
    }

    return this.layers.reduce<Buffer[]>((proof, layer) => {
      const pairElement = this.getPairElement(idx, layer);

      if (pairElement) {
        proof.push(pairElement);
      }

      idx = Math.floor(idx / 2);

      return proof;
    }, []);
  }

  getHexProof(el: string): string[] {
    const proof = this.getProof(el);
    return this.bufArrToHexArr(proof);
  }

  getPairElement(idx: number, layer: Buffer[]): Buffer | null {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (pairIdx < layer.length) {
      return layer[pairIdx];
    } else {
      return null;
    }
  }

  bufIndexOf(el: Buffer, arr: Buffer[]): number {
    let hash: Buffer;

    // Convert element to 32 byte hash if it is not one already
    if (el.length !== 32 || !Buffer.isBuffer(el)) {
      hash = Buffer.from(keccak256(el).slice(2), "hex");
    } else {
      hash = el;
    }

    for (let i = 0; i < arr.length; i++) {
      if (hash.equals(arr[i])) {
        return i;
      }
    }

    return -1;
  }

  bufDedup(elements: Buffer[]): Buffer[] {
    return elements.filter((el, idx) => {
      return this.bufIndexOf(el, elements) === idx;
    });
  }

  bufArrToHexArr(arr: Buffer[]): string[] {
    if (arr.some((el) => !Buffer.isBuffer(el))) {
      throw new Error("Array is not an array of buffers");
    }

    return arr.map((el) => "0x" + el.toString("hex"));
  }

  sortAndConcat(...args: Buffer[]): Buffer {
    return Buffer.concat([...args].sort(Buffer.compare));
  }
}

export interface IEarningsTree extends IMerkleTree {
  leaves: string[];
}

export class EarningsTree extends MerkleTree implements IEarningsTree {
  leaves: string[];

  constructor(delegators: IDelegator[]) {
    const leaves = delegators.map((d) =>
      solidityPacked(
        ["address", "uint256", "uint256"],
        [d.delegator, d.pendingStake, d.pendingFees]
      )
    );
    super(leaves);
    this.leaves = leaves;
  }

  static fromJSON(json: string): EarningsTree {
    const data = JSON.parse(json);
    const leaves = Array.isArray(data) ? data : data.delegators;
    
    // Create a new instance with the parsed delegators
    const delegators = leaves.map((leaf: any) => ({
      delegator: leaf.delegator as Address,
      pendingStake: BigInt(leaf.pendingStake),
      pendingFees: BigInt(leaf.pendingFees),
    }));
    
    return new EarningsTree(delegators);
  }

  toJSON(): string {
    return JSON.stringify({
      delegators: this.leaves.map((leaf) => {
        const [delegator, pendingStake, pendingFees] = new AbiCoder().decode(
          ["address", "uint256", "uint256"],
          hexlify(leaf)
        );
        return { 
          delegator, 
          pendingStake: pendingStake.toString(),
          pendingFees: pendingFees.toString()
        };
      }),
    });
  }
}
