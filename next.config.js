const nextConfig = {
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

  webpack(config) {
    config.module.rules.push({
      test: /\.(graphql|gql)$/,
      exclude: /node_modules/,
      use: {
        loader: "graphql-tag/loader",
      },
    });
    return config;
  },
};

module.exports = nextConfig;
