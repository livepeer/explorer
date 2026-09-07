/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,

  // Compile the sanitize-html chain into the build: Vercel's runtime
  // require() cannot load ESM-only packages like htmlparser2 >=11
  // (it runs node with --no-experimental-require-module).
  transpilePackages: [
    "sanitize-html",
    "htmlparser2",
    "domelementtype",
    "domhandler",
    "domutils",
    "entities",
  ],

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  async redirects() {
    return [
      {
        source: "/accounts/:slug",
        destination: "/accounts/:slug/delegating",
        permanent: false,
      },
      {
        source: "/transcoders",
        destination: "/orchestrators",
        permanent: false,
      },
      {
        source: "/accounts/:account/transcoding",
        destination: "/accounts/:account/orchestrating",
        permanent: false,
      },
      {
        source: "/accounts/:account/campaign",
        destination: "/accounts/:account/orchestrating",
        permanent: false,
      },
      {
        source: "/accounts/:account/staking",
        destination: "/accounts/:account/delegating",
        permanent: false,
      },
      {
        source: "/accounts/:account/overview",
        destination: "/accounts/:account/delegating",
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
