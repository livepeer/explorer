import { claimArgs, ClaimError } from "@/lib/bridge/withdrawals-server";

/**
 * The arguments for claiming one LPT withdrawal on Ethereum with
 * Outbox.executeTransaction: its message and an outbox proof. The browser
 * checks them before anything is signed (lib/bridge/claim.ts), and the
 * Outbox checks the proof on-chain.
 *
 * GET ?id=<message number> → { args: ClaimArgs }
 */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  if (!/^\d{1,12}$/.test(id)) {
    return Response.json({ error: "Pass a withdrawal id." }, { status: 400 });
  }
  try {
    const args = await claimArgs(id);
    // A proof stays valid once built: the Outbox keeps every root.
    return Response.json(
      { args },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (e) {
    if (e instanceof ClaimError) {
      return Response.json({ error: e.message }, { status: e.status });
    }
    console.error("bridge claim", e);
    return Response.json(
      { error: "Couldn't prepare this claim right now." },
      { status: 502 }
    );
  }
}
