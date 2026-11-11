import { getPollableLips } from "@/lib/governance/lips";
import { memoize } from "@/lib/server/memo";

/** Shared for ten minutes, however the request is varied. */
const pollableLips = memoize(() => getPollableLips(), {
  ttlMs: 10 * 60_000,
  max: 1,
});

export const revalidate = 600;

/** LIPs that can be put to a poll right now. */
export async function GET() {
  try {
    const { commit, lips } = await pollableLips("lips");
    // The full text stays server-side; the page links to GitHub instead.
    return Response.json({
      commit,
      lips: lips.map(({ lip, title, created, url }) => ({
        lip,
        title,
        created,
        url,
      })),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Couldn't load LIPs" },
      { status: 502 }
    );
  }
}
