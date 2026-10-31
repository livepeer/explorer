import { decodeFunctionData, isAddressEqual } from "viem";

import {
  finalizeInboundTransferAbi,
  L1_LPT,
  L1_LPT_GATEWAY,
  L2_LPT_GATEWAY,
} from "./config";
import type { ClaimArgs, Withdrawal } from "./types";

/**
 * The claim the server prepared, checked against the withdrawal it's for
 * before anything is signed: Livepeer's gateways at both ends, no ETH, and
 * a payout of exactly this LPT to this recipient. Returns the arguments
 * for Outbox.executeTransaction, or throws saying what didn't match.
 */
export function checkClaim(args: ClaimArgs, w: Withdrawal) {
  const fail = (what: string) => {
    throw new Error(`This claim doesn't match the withdrawal (${what}).`);
  };
  if (args.index !== w.id) fail("message number");
  if (!isAddressEqual(args.l2Sender, L2_LPT_GATEWAY)) fail("sender");
  if (!isAddressEqual(args.to, L1_LPT_GATEWAY)) fail("gateway");
  if (BigInt(args.value) !== 0n) fail("ETH value");

  let call;
  try {
    call = decodeFunctionData({
      abi: finalizeInboundTransferAbi,
      data: args.data,
    });
  } catch {
    return fail("payout");
  }
  const [token, , to, amount] = call.args;
  if (!isAddressEqual(token, L1_LPT)) fail("token");
  if (!isAddressEqual(to, w.to as `0x${string}`)) fail("recipient");
  if (amount !== BigInt(w.amount)) fail("amount");

  return [
    args.proof,
    BigInt(args.index),
    args.l2Sender,
    args.to,
    BigInt(args.l2Block),
    BigInt(args.l1Block),
    BigInt(args.l2Timestamp),
    BigInt(args.value),
    args.data,
  ] as const;
}

export async function fetchClaim(id: string): Promise<ClaimArgs> {
  const res = await fetch(`/api/bridge/claim?id=${id}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Couldn't prepare this claim");
  return body.args;
}
