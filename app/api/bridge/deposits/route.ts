import { isAddress } from "viem";

import { depositsFor } from "@/lib/bridge/deposits-server";

/**
 * The week's LPT deposits from Ethereum to Arbitrum sent from or to some
 * addresses, each with its state on Arbitrum: processing, needing a retry
 * (with its deadline), or arrived. See lib/bridge/deposits-server.ts.
 *
 * GET ?address=0x…,0x… (up to 20) → { deposits: TrackedDeposit[] }
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
    const deposits = await depositsFor(addresses);
    return Response.json(
      { deposits },
      { headers: { "Cache-Control": "private, max-age=15" } }
    );
  } catch (e) {
    console.error("bridge deposits", e);
    return Response.json(
      { error: "Couldn't check deposits right now." },
      { status: 502 }
    );
  }
}
