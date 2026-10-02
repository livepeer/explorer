// Stand-in for optional x402 payment modules that @coinbase/cdp-sdk imports
// lazily (via RainbowKit's Base Account wallet). The explorer never calls
// those code paths; aliasing keeps the bundler from failing on them.
module.exports = {};
