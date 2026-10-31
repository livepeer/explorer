/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,

  turbopack: {
    resolveAlias: Object.fromEntries(
      [
        "@x402/core/client",
        "@x402/evm",
        "@x402/evm/exact/client",
        "@x402/evm/upto/client",
        "@x402/svm/exact/client",
      ].map((m) => [m, "./lib/empty-module.js"])
    ),
  },

  // Safe{Wallet} fetches the manifest cross-origin to add the explorer as a Safe App.
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
      },
    ];
  },

  // Keep links into the previous explorer's URL structure working.
  async redirects() {
    const accountTabs = [
      "delegating",
      "orchestrating",
      "history",
      "staking",
      "overview",
      "transcoding",
      "campaign",
    ];
    return [
      ...accountTabs.map((tab) => ({
        source: `/accounts/:account/${tab}`,
        destination: "/accounts/:account",
        permanent: true,
      })),
      {
        source: "/accounts/:account/broadcasting",
        destination: "/gateways/:account",
        permanent: true,
      },
      {
        source: "/transcoders",
        destination: "/orchestrators",
        permanent: true,
      },
      {
        source: "/leaderboard",
        destination: "/orchestrators",
        permanent: true,
      },
      { source: "/transactions", destination: "/activity", permanent: true },
      { source: "/voting", destination: "/governance", permanent: true },
      {
        source: "/voting/:poll",
        destination: "/governance/polls/:poll",
        permanent: true,
      },
      // The previous explorer's migration tool: the portfolio shows what
      // each wallet has left from before the move to Arbitrum, with its
      // Claim and Migrate buttons, so its links land there.
      { source: "/migrate", destination: "/", permanent: true },
      { source: "/migrate/:path+", destination: "/", permanent: true },
      { source: "/treasury", destination: "/governance", permanent: true },
      {
        source: "/treasury/:proposal",
        destination: "/governance/proposals/:proposal",
        permanent: true,
      },
    ];
  },
};

/** `PHASE_PRODUCTION_BUILD` from next/constants: `next build`. */
const PHASE_PRODUCTION_BUILD = "phase-production-build";

module.exports = (phase) => {
  // Without a subgraph key or endpoint the app falls back to the staging
  // subgraph, which is fine for `next dev` but would ship staging balances
  // and votes as if they were production's. Refuse to build that.
  if (
    phase === PHASE_PRODUCTION_BUILD &&
    !process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY &&
    !process.env.NEXT_PUBLIC_SUBGRAPH_ENDPOINT
  ) {
    throw new Error(
      "Set NEXT_PUBLIC_SUBGRAPH_API_KEY or NEXT_PUBLIC_SUBGRAPH_ENDPOINT to build. Without either, the app would read the staging subgraph."
    );
  }
  return nextConfig;
};
