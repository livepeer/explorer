import { querySubgraph } from "@/lib/subgraph/client";

/**
 * Total LPT supply, as a bare number, cached for a day.
 *
 * Do not remove: nothing in the app calls this, but exchanges and price
 * trackers such as CoinGecko read it for LPT's supply. Keep the path and
 * the response (a plain JSON number) as they are.
 *
 * GET → number
 */
export async function GET() {
  try {
    const { protocol } = await querySubgraph<{
      protocol: { totalSupply: string };
    }>(`{ protocol(id: "0") { totalSupply } }`);
    return Response.json(Number(protocol.totalSupply), {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (e) {
    console.error("Total token supply:", e);
    return Response.json(
      { error: "Total supply is unavailable right now." },
      { status: 502 }
    );
  }
}
