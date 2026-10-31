import {
  decodeFunctionData,
  type Hex,
  hexToBigInt,
  hexToNumber,
  isAddressEqual,
  slice,
} from "viem";

import { bondingManager } from "@/lib/abis/BondingManager";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { poll } from "@/lib/abis/Poll";

/* ── What a queued Safe transaction does, in Livepeer terms ─────────────── */

export type ProposalAction =
  | { kind: "delegate"; to: string; amount: bigint }
  | { kind: "undelegate"; amount: bigint }
  | { kind: "redelegate"; lockId: bigint; to?: string }
  | { kind: "withdrawStake"; lockId: bigint }
  | { kind: "withdrawFees"; amount: bigint }
  | { kind: "approve"; amount: bigint }
  | { kind: "treasuryVote"; proposal: bigint; support: number }
  | { kind: "pollVote"; poll: string; choice: bigint };

/** Safe's operation: 0 is a CALL, 1 a DELEGATECALL. */
export type Operation = 0 | 1;

type Call = { to: string; data: Hex; operation: Operation };

/** Known contracts; a call to an address we can't confirm is left out. */
export type LivepeerContracts = {
  bondingManager?: string;
  token?: string;
  governor?: string;
};

const MULTI_SEND = "0x8d80ff0a"; // multiSend(bytes)

/**
 * Safe's canonical MultiSend and MultiSendCallOnly deployments on Arbitrum
 * (v1.3.0, its EIP-155 variants, and v1.4.1). A batch is only read when the
 * Safe delegatecalls one of these; delegatecalling anything else runs
 * arbitrary code as the Safe, whatever its calldata looks like.
 */
const MULTI_SEND_CONTRACTS = [
  "0xa238cbeb142c10ef7ad8442c6d1f9e89e07e7761",
  "0x40a2accbd92bca938b02010e17a5b8929b49130d",
  "0x998739bfdaadde7c933b942a68053933098f9eda",
  "0xa1dabef33b3b82c7814b6d82a79e50f4ac44102b",
  "0x38869bf66a61cf6bdb996a6ae40d5853fd43b526",
  "0x9641d764fc13c8b624c04430c7356c1c7c8102e2",
];

/**
 * Unpack a Safe MultiSend batch: each call is packed as operation (1 byte),
 * to (20), value (32), data length (32) and data. Returns null if the data
 * isn't a well-formed batch.
 */
export function unpackMultiSend(data: Hex): Call[] | null {
  if (!data.startsWith(MULTI_SEND)) return null;
  try {
    // multiSend(bytes): selector, offset, length, then the packed calls.
    const len = hexToNumber(slice(data, 36, 68));
    const packed = slice(data, 68, 68 + len);
    const calls: Call[] = [];
    let i = 0;
    const size = (packed.length - 2) / 2;
    while (i < size) {
      const operation = hexToNumber(slice(packed, i, i + 1));
      if (operation !== 0 && operation !== 1) return null;
      const to = slice(packed, i + 1, i + 21);
      const n = Number(hexToBigInt(slice(packed, i + 53, i + 85)));
      const callData = n ? slice(packed, i + 85, i + 85 + n) : "0x";
      calls.push({ to, data: callData, operation });
      i += 85 + n;
    }
    return calls;
  } catch {
    return null;
  }
}

/** An unresolved known address matches nothing: fail closed. */
const same = (a: string, b?: string) =>
  b != null && isAddressEqual(a as Hex, b as Hex);

/** One call, if it's a Livepeer action from the Safe. */
export function describeCall(
  { to, data }: Call,
  contracts: LivepeerContracts
): ProposalAction | null {
  const tryDecode = <A extends readonly unknown[]>(abi: A) => {
    try {
      return decodeFunctionData({ abi: abi as never, data }) as {
        functionName: string;
        args: readonly unknown[];
      };
    } catch {
      return null;
    }
  };

  const bm = same(to, contracts.bondingManager)
    ? tryDecode(bondingManager)
    : null;
  if (bm) {
    const a = bm.args;
    switch (bm.functionName) {
      case "bondWithHint":
      case "bond":
        return {
          kind: "delegate",
          amount: a[0] as bigint,
          to: (a[1] as string).toLowerCase(),
        };
      case "unbondWithHint":
      case "unbond":
        return { kind: "undelegate", amount: a[0] as bigint };
      case "rebondWithHint":
      case "rebond":
        return { kind: "redelegate", lockId: a[0] as bigint };
      case "rebondFromUnbondedWithHint":
      case "rebondFromUnbonded":
        return {
          kind: "redelegate",
          to: (a[0] as string).toLowerCase(),
          lockId: a[1] as bigint,
        };
      case "withdrawStake":
        return { kind: "withdrawStake", lockId: a[0] as bigint };
      case "withdrawFees":
        return { kind: "withdrawFees", amount: a[1] as bigint };
    }
  }

  const token = same(to, contracts.token) ? tryDecode(livepeerToken) : null;
  if (
    token?.functionName === "approve" &&
    contracts.bondingManager &&
    isAddressEqual(token.args[0] as Hex, contracts.bondingManager as Hex)
  ) {
    return { kind: "approve", amount: token.args[1] as bigint };
  }

  const gov = same(to, contracts.governor) ? tryDecode(livepeerGovernor) : null;
  if (
    gov &&
    (gov.functionName === "castVote" ||
      gov.functionName === "castVoteWithReason")
  ) {
    return {
      kind: "treasuryVote",
      proposal: gov.args[0] as bigint,
      support: Number(gov.args[1]),
    };
  }

  // Polls are separate contracts, so only the call shape identifies them.
  const pollVote = tryDecode(poll);
  if (pollVote?.functionName === "vote") {
    return {
      kind: "pollVote",
      poll: to.toLowerCase(),
      choice: pollVote.args[0] as bigint,
    };
  }
  return null;
}

const isMultiSend = (to: string) =>
  MULTI_SEND_CONTRACTS.some((m) => isAddressEqual(to as Hex, m as Hex));

/**
 * The Livepeer actions in a Safe transaction, batch or single call. Empty
 * when it has nothing to do with Livepeer, or anything we don't recognise
 * is batched alongside (better to say nothing than half the story).
 */
export function describeProposal(
  call: Call,
  contracts: LivepeerContracts
): ProposalAction[] {
  const batch = unpackMultiSend(call.data);
  // A batch only when the Safe delegatecalls a real MultiSend; any other
  // delegatecall runs someone else's code as the Safe.
  if (batch && (call.operation !== 1 || !isMultiSend(call.to))) return [];
  if (!batch && call.operation !== 0) return [];
  const calls = batch ?? [call];
  // Every action is a plain CALL from the Safe, not code it runs as itself.
  if (calls.some((c) => c.operation !== 0)) return [];
  const actions = calls.map((c) => describeCall(c, contracts));
  return actions.every(Boolean) ? (actions as ProposalAction[]) : [];
}
