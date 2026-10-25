import { decodeFunctionData, type Hex, isAddressEqual, slice } from "viem";

import { livepeerToken } from "@/lib/abis/LivepeerToken";
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
      target: string;
      /** ETH sent with the call, in ETH. */
      value: number;
      /** The 4-byte function selector, or null without calldata. */
      selector: string | null;
    };

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
    };
  });
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
