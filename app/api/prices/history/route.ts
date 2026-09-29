import { pricesAt } from "@/lib/prices/history";

// Vercel Hobby's ceiling. A first, uncached export may need longer, so the
// lookup stops at a budget below it and the client asks again for the rest.
export const maxDuration = 60;
const BUDGET_MS = 45_000;

const MAX_TIMES = 20_000;
const MAX_GET_TIMES = 50;
const EARLIEST = Date.UTC(2015, 0, 1) / 1000;

/**
 * USD prices of LPT and ETH at the moments asked for (unix seconds), for
 * valuing earnings at the time. Read from Coinbase's public hourly candles
 * on the server, where the pages are cached.
 *
 * POST { times: number[] } → { lpt: (number | null)[], eth: (number | null)[] }
 * GET ?times=1735689600,1704067200 — the same for a few moments, handy for
 * checking from a browser.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    times?: unknown;
  } | null;
  return respond(body?.times, MAX_TIMES);
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("times");
  const times = raw
    ? raw
        .split(",")
        .filter(Boolean)
        .map((t) => Number(t))
    : undefined;
  return respond(times, MAX_GET_TIMES);
}

async function respond(times: unknown, max: number) {
  const now = Date.now() / 1000;
  if (
    !Array.isArray(times) ||
    !times.length ||
    times.length > max ||
    !times.every(
      (t) =>
        typeof t === "number" &&
        Number.isFinite(t) &&
        t >= EARLIEST &&
        t <= now + 86_400
    )
  )
    return Response.json(
      { error: `Send 1 to ${max} unix timestamps (seconds) as times.` },
      { status: 400 }
    );

  const deadline = Date.now() + BUDGET_MS;
  try {
    const [lpt, eth] = await Promise.all([
      pricesAt("LPT", times, deadline),
      pricesAt("ETH", times, deadline),
    ]);
    return Response.json({ times, lpt, eth });
  } catch (e) {
    console.error("Price history:", e);
    // The provider's status and message, to tell a rate limit from an outage.
    return Response.json(
      {
        error: "Price history is unavailable right now.",
        detail: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
