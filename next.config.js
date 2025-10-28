/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don’t try to polyfill Node core modules in the browser
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        net: false,
        tls: false,
      };
      // Prevent bundling native ws speedups and the loader in the browser
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        ws: false,
        bufferutil: false,
        "utf-8-validate": false,
        "node-gyp-build": false,
      };
    }
    return config;
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
