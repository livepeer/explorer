import { decodeFunctionData, type Hex, isAddressEqual, slice } from "viem";

import { bondingManager } from "@/lib/abis/BondingManager";
import { bondingVotes } from "@/lib/abis/BondingVotes";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { roundsManager } from "@/lib/abis/RoundsManager";
import { PROTOCOL_CONTRACTS } from "@/lib/config";
import { fromWei } from "@/lib/format";

/**
 * What a treasury proposal does if it passes. On-chain a proposal is a list
 * of calls (target, ETH value, calldata); a funding request is one call to
 * the LPT token's `transfer`. Those are read as such; anything else is kept
 * as a plain call, so nothing a proposal does is hidden.
 */
export type ProposalAction =
  | { kind: "lptTransfer"; to: string; amount: number }
  | {
      kind: "call";
      /** The full address called. */
      target: string;
      /** ETH sent with the call, in ETH. */
      value: number;
      /** The 4-byte function selector, or null without calldata. */
      selector: string | null;
      /** The full calldata, so the call can be checked exactly. */
      data: string;
      /** The protocol contract it calls, when it's one we know. */
      contract: string | null;
      /** The function and its arguments, when the contract's ABI reads it. */
      decoded: { functionName: string; args: string[] } | null;
    };

/** Protocol contracts whose calls we can read, by address. */
const KNOWN = [
  { name: "LivepeerToken", abi: livepeerToken },
  { name: "BondingManager", abi: bondingManager },
  { name: "RoundsManager", abi: roundsManager },
  { name: "LivepeerGovernor", abi: livepeerGovernor },
  { name: "BondingVotes", abi: bondingVotes },
] as const;

/** An argument as text: full numbers and addresses, nothing rounded. */
function argText(v: unknown): string {
  if (typeof v === "bigint") return v.toString();
  if (Array.isArray(v)) return `[${v.map(argText).join(", ")}]`;
  return String(v);
}

/** Which protocol contract a call targets, and what it calls there. */
function readCall(target: string, data: Hex) {
  const known = KNOWN.find((k) =>
    isAddressEqual(target as Hex, PROTOCOL_CONTRACTS[k.name])
  );
  const name =
    known?.name ??
    (isAddressEqual(target as Hex, PROTOCOL_CONTRACTS.Treasury)
      ? "Treasury"
      : null);
  if (!known || data.length < 10) return { contract: name, decoded: null };
  try {
    const { functionName, args } = decodeFunctionData({
      abi: known.abi,
      data,
    });
    return {
      contract: name,
      decoded: { functionName, args: (args ?? []).map(argText) },
    };
  } catch {
    return { contract: name, decoded: null };
  }
}

export function decodeProposalActions(
  targets: readonly string[],
  values: readonly string[],
  calldatas: readonly string[]
): ProposalAction[] {
  return targets.map((target, i) => {
    const data = (calldatas[i] ?? "0x") as Hex;
    let value = 0n;
    try {
      value = BigInt(values[i] ?? "0");
    } catch {
      // A malformed value is shown as a call, never thrown mid-render.
    }
    // Only a transfer on the real LPT token, sending no ETH, is a request
    // for LPT: the same selector on another contract could be anything.
    if (
      value === 0n &&
      isAddressEqual(target as Hex, PROTOCOL_CONTRACTS.LivepeerToken)
    ) {
      try {
        const { functionName, args } = decodeFunctionData({
          abi: livepeerToken,
          data,
        });
        if (functionName === "transfer") {
          const [to, amount] = args as readonly [string, bigint];
          return {
            kind: "lptTransfer",
            to: to.toLowerCase(),
            amount: fromWei(amount),
          };
        }
      } catch {
        // Not a call the token's ABI knows: falls through to a plain call.
      }
    }
    return {
      kind: "call",
      target: target.toLowerCase(),
      value: fromWei(value),
      selector: data.length >= 10 ? slice(data, 0, 4) : null,
      data,
      ...readCall(target, data),
    };
  });
}

/**
 * The LPT a proposal's transfers send, counted transfer by transfer even
 * when it makes other calls too: for totals (what the treasury has paid
 * out, what's up for vote), where a mixed proposal's transfers are still
 * real spending.
 */
export function transferredLpt(actions: readonly ProposalAction[]) {
  let amount = 0;
  for (const a of actions) if (a.kind === "lptTransfer") amount += a.amount;
  return amount;
}

/**
 * The LPT a proposal asks for, when every call it makes is an LPT transfer
 * (as every funding request is): the total, and who receives it. Null when
 * it does anything else, so a mixed proposal isn't summed into a misleading
 * headline.
 */
export function requestedLpt(actions: readonly ProposalAction[]) {
  if (!actions.length) return null;
  let amount = 0;
  const recipients: string[] = [];
  for (const a of actions) {
    if (a.kind !== "lptTransfer") return null;
    amount += a.amount;
    if (!recipients.includes(a.to)) recipients.push(a.to);
  }
  return { amount, recipients };
}
