import {
  concat,
  encodeFunctionData,
  encodePacked,
  type Hex,
  maxUint256,
  size,
} from "viem";

import { bondingManager } from "@/lib/abis/BondingManager";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { livepeerToken } from "@/lib/abis/LivepeerToken";

import { describeProposal, unpackMultiSend } from "./proposals";

const BM = "0x35bcf3c30594191d53231e4ff333e8a770453e40";
const LPT = "0x289ba1701c2f088cf0faf8b3705246331cb8a839";
const GOV = "0xcfe4e2879b786c3aa075813f0e364bb5accb6aa0";
const MULTI_SEND = "0x40a2accbd92bca938b02010e17a5b8929b49130d";
const ORCH = "0xb29178bd5e0da702ab69129048af7b9fcf222026";
const ZERO = "0x0000000000000000000000000000000000000000";
const contracts = { bondingManager: BM, token: LPT, governor: GOV };

const bond = (amount: bigint) =>
  encodeFunctionData({
    abi: bondingManager,
    functionName: "bondWithHint",
    args: [amount, ORCH, ZERO, ZERO, ZERO, ZERO],
  });
const approve = (amount: bigint) =>
  encodeFunctionData({
    abi: livepeerToken,
    functionName: "approve",
    args: [BM, amount],
  });

/** Pack calls the way Safe's MultiSend contract expects. */
function multiSend(calls: { to: string; data: Hex }[]) {
  const packed = concat(
    calls.map((c) =>
      encodePacked(
        ["uint8", "address", "uint256", "uint256", "bytes"],
        [0, c.to as Hex, 0n, BigInt(size(c.data)), c.data]
      )
    )
  );
  return encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "multiSend",
        stateMutability: "payable",
        inputs: [{ name: "transactions", type: "bytes" }],
        outputs: [],
      },
    ],
    functionName: "multiSend",
    args: [packed],
  });
}

const LPT_5K = 5000n * 10n ** 18n;

describe("describeProposal", () => {
  it("reads a delegation", () => {
    expect(describeProposal({ to: BM, data: bond(LPT_5K) }, contracts)).toEqual(
      [{ kind: "delegate", to: ORCH, amount: LPT_5K }]
    );
  });

  it("unpacks an approve-and-delegate batch", () => {
    const data = multiSend([
      { to: LPT, data: approve(LPT_5K) },
      { to: BM, data: bond(LPT_5K) },
    ]);
    expect(unpackMultiSend(data)).toHaveLength(2);
    expect(describeProposal({ to: MULTI_SEND, data }, contracts)).toEqual([
      { kind: "approve", amount: LPT_5K },
      { kind: "delegate", to: ORCH, amount: LPT_5K },
    ]);
  });

  it("reads a treasury vote", () => {
    const data = encodeFunctionData({
      abi: livepeerGovernor,
      functionName: "castVote",
      args: [42n, 1],
    });
    expect(describeProposal({ to: GOV, data }, contracts)).toEqual([
      { kind: "treasuryVote", proposal: 42n, support: 1 },
    ]);
  });

  it("ignores approvals for anyone but the BondingManager", () => {
    const data = encodeFunctionData({
      abi: livepeerToken,
      functionName: "approve",
      args: [ORCH, maxUint256],
    });
    expect(describeProposal({ to: LPT, data }, contracts)).toEqual([]);
  });

  it("ignores calls to a lookalike contract", () => {
    expect(describeProposal({ to: ORCH, data: bond(1n) }, contracts)).toEqual(
      []
    );
  });

  it("says nothing about a batch with unknown calls in it", () => {
    const data = multiSend([
      { to: BM, data: bond(LPT_5K) },
      { to: ORCH, data: "0xdeadbeef" },
    ]);
    expect(describeProposal({ to: MULTI_SEND, data }, contracts)).toEqual([]);
  });
});
