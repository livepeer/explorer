/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
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

  async redirects() {
    return [
      {
        source: "/design/mocks",
        destination: "/design/mocks/index.html",
        permanent: false,
      },
      {
        source: "/design/mocks/",
        destination: "/design/mocks/index.html",
        permanent: false,
      },
      {
        // Serve the review HTML at its real path. A rewrite would leave the
        // address bar on /design/mocks/<slug>, and ../shared/inter.css would
        // resolve one directory too high. Exclude dotted names so the hub
        // destination /design/mocks/index.html is not treated as a slug.
        source: "/design/mocks/:slug([^/.]+)",
        destination: "/design/mocks/:slug/index.html",
        permanent: false,
      },
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
