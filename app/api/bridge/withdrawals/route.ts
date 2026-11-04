import { isAddress } from "viem";

import { withdrawalsFor } from "@/lib/bridge/withdrawals-server";

/**
 * Unclaimed LPT withdrawals from Arbitrum to Ethereum for some addresses,
 * and whether each can be claimed yet. A browser can't find these itself:
 * keyed RPCs only search logs 10k blocks at a time, and Arbitrum is past
 * 500M. See lib/bridge/withdrawals-server.ts.
 *
 * GET ?address=0x…,0x… (up to 20) → { withdrawals: BridgeWithdrawal[] }
 */
export async function GET(req: Request) {
  const addresses = (new URL(req.url).searchParams.get("address") ?? "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
  if (
    !addresses.length ||
    addresses.length > 20 ||
    !addresses.every((a) => isAddress(a))
  ) {
    return Response.json(
      { error: "Pass up to 20 addresses, comma-separated." },
      { status: 400 }
    );
  }
  try {
    const withdrawals = await withdrawalsFor(addresses);
    return Response.json(
      { withdrawals },
      { headers: { "Cache-Control": "public, s-maxage=60, max-age=30" } }
    );
  } catch (e) {
    console.error("bridge withdrawals", e);
    return Response.json(
      { error: "Couldn't check bridge withdrawals right now." },
      { status: 502 }
    );
  }
}
