/** @type {import('next').NextConfig} */
const nextConfig = {
  // TODO: TEMP for Node 20 on Next 12: use Babel + Terser instead of SWC, remove in future.
  swcMinify: false,

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
