import { memoize } from "@/lib/server/memo";
import { fetchTreasury } from "@/lib/treasury";

/**
 * The treasury's balance, ceiling, reward cut and balance history. Reading
 * the history takes many archive calls, so it's shared for ten minutes.
 *
 * GET → TreasuryState (see lib/treasury.ts)
 */
const treasury = memoize(() => fetchTreasury(), {
  ttlMs: 10 * 60_000,
  max: 1,
});

export async function GET() {
  try {
    return Response.json(await treasury("treasury"), {
      headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=600" },
    });
  } catch (e) {
    console.error("Treasury:", e);
    return Response.json(
      { error: "Treasury data is unavailable right now." },
      { status: 502 }
    );
  }
}
