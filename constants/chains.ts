const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;

if (typeof INFURA_KEY === "undefined") {
  throw new Error(
    `NEXT_PUBLIC_INFURA_KEY must be a defined environment variable`
  );
}

/**
 * List of all the networks supported by the Livepeer Explorer
 */
export enum SupportedChainId {
  MAINNET = 1,
  RINKEBY = 4,

  ARBITRUM_ONE = 42161,
  ARBITRUM_RINKEBY = 421611,
}

export const DEFAULT_CHAIN_ID =
  SupportedChainId[process.env.NEXT_PUBLIC_NETWORK];

/**
 * Array of all the supported chain IDs
 */
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(
  SupportedChainId
).filter((id) => typeof id === "number") as SupportedChainId[];

/**
 * These are the network URLs used by the Livepeer Explorer when there is not another available source of chain data
 */
export const INFURA_NETWORK_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.RINKEBY]: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.ARBITRUM_ONE]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  [SupportedChainId.ARBITRUM_RINKEBY]: `https://arbitrum-rinkeby.infura.io/v3/${INFURA_KEY}`,
};

export enum NetworkType {
  L1,
  L2,
}

export const CHAIN_INFO = {
  [SupportedChainId.MAINNET]: {
    networkType: NetworkType.L1,
    explorer: "https://etherscan.io/",
    explorerAPI: "https://api.arbiscan.io/api",
    label: "Ethereum",
    // logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/livepeer-rinkeby",
    contracts: {
      controller: "0xA268AEa9D048F8d3A592dD7f1821297972D4C8Ea",
      bondingManager: "0xe75a5DccfFe8939F7f16CC7f63EB252bB542FE95",
      pollCreator: "0x149805EF90FaDA12D27e8a020b6c138F3d86A9a3",
    },
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
  },
  [SupportedChainId.RINKEBY]: {
    networkType: NetworkType.L1,
    explorer: "https://rinkeby.etherscan.io/",
    explorerAPI: "https://testnet.arbiscan.io/api",
    label: "Rinkeby",
    // logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Rinkeby Ether", symbol: "rETH", decimals: 18 },
      rpcUrl: INFURA_NETWORK_URLS[SupportedChainId.RINKEBY],
    },
    subgraph: "https://api.thegraph.com/subgraphs/name/adamsoffer/livepeer",
    contracts: {
      controller: "0x7159fa1e24c05a91d4c03f98ff49069602ab88c3",
      bondingManager: "0xf71b1fb1bd297ddb4e92c9ab89d5f57ffcc899f9",
      pollCreator: "0x149805EF90FaDA12D27e8a020b6c138F3d86A9a3",
      l1Migrator: "0xcC7E99a650ED63f061AC26660f2bb71570e571b2",
      l1GatewayRouter: "0x70C143928eCfFaf9F5b406f7f4fC28Dc43d68380",
    },
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    networkType: NetworkType.L2,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://arbiscan.io/",
    explorerAPI: "https://api.arbiscan.io/api",
    label: "Arbitrum",
    // logoUrl: arbitrumLogoUrl,
    // defaultListUrl: ARBITRUM_LIST,
    addNetworkInfo: {
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: "https://arb1.arbitrum.io/rpc",
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/livepeer-arbitrum",
    contracts: {
      controller: "",
      pollCreator: "",
      l2GatewayRouter: "0x5288c571Fd7aD117beA99bF60FE0846C4E84F933",
      inbox: "0x4c6f947Ae67F572afa4ae0730947DE7C874F95Ef",
      outbox: "0x760723CD2e632826c38Fef8CD438A4CC7E7E1A40",
      arbRetryableTx: "0x000000000000000000000000000000000000006E",
      nodeInterface: "0x00000000000000000000000000000000000000C8",
    },
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
  },
  [SupportedChainId.ARBITRUM_RINKEBY]: {
    networkType: NetworkType.L2,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://testnet.arbiscan.io/",
    explorerAPI: "https://testnet.arbiscan.io/api",
    label: "Arbitrum Rinkeby",
    // logoUrl: arbitrumLogoUrl,
    // defaultListUrl: ARBITRUM_LIST,
    addNetworkInfo: {
      nativeCurrency: {
        name: "Rinkeby Arbitrum Ether",
        symbol: "rinkArbETH",
        decimals: 18,
      },
      rpcUrl: "https://rinkeby.arbitrum.io/rpc",
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/livepeer-arbitrum-rinkeby",
    contracts: {
      controller: "0x4f1a76b331b3bdd4a5351a21510119738310cf55",
      pollCreator: "",
      l2GatewayRouter: "0x9413AD42910c1eA60c737dB5f58d1C504498a3cD",
      inbox: "0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e",
      outbox: "0x2360A33905dc1c72b12d975d975F42BaBdcef9F3",
      arbRetryableTx: "0x000000000000000000000000000000000000006E",
      nodeInterface: "0x00000000000000000000000000000000000000C8",
    },
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
  },
};
