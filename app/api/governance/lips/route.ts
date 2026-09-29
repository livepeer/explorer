import { getPollableLips } from "@/lib/governance/lips";

export const revalidate = 600;

/** LIPs that can be put to a poll right now. */
export async function GET() {
  try {
    const { commit, lips } = await getPollableLips();
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
