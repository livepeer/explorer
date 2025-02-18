import arbitrumLogoUrl from "../public/img/logos/arbitrum.png";
import ethereumLogoUrl from "../public/img/logos/ethereum.png";

import { mainnet, arbitrum, goerli, arbitrumGoerli } from 'wagmi/chains';
import { ethers } from "ethers";
import {
  Address,
  createPublicClient,
  http,
} from "viem";

export const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;
export const L1_RPC_URL = process.env.NEXT_PUBLIC_L1_RPC_URL;
export const L2_RPC_URL = process.env.NEXT_PUBLIC_L2_RPC_URL;
const NETWORK = process.env.NEXT_PUBLIC_NETWORK;

const SUBGRAPH_KEY = process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY;
const SUBGRAPH_ID = process.env.NEXT_PUBLIC_SUBGRAPH_ID;

// Check for required environment variables
if (typeof NETWORK === "undefined") {
  throw new Error("NEXT_PUBLIC_NETWORK must be defined");
}

// Function to get RPC URL with fallback logic
const getRpcUrl = (chainId: number, isL1: boolean = false) => {
  if (INFURA_KEY) {
    return `https://${isL1 ? "" : "arbitrum-"}${
      chainId === mainnet.id || chainId === arbitrum.id ? "mainnet" : "goerli"
    }.infura.io/v3/${INFURA_KEY}`;
  }
  
  // Use direct RPC URLs as fallback
  if (isL1 && L1_RPC_URL) {
    return L1_RPC_URL;
  }
  if (!isL1 && L2_RPC_URL) {
    return L2_RPC_URL;
  }
  
  throw new Error(
    `No RPC URL available for ${isL1 ? "L1" : "L2"}. Please provide either NEXT_PUBLIC_INFURA_KEY or NEXT_PUBLIC_${
      isL1 ? "L1" : "L2"
    }_RPC_URL`
  );
};

// Create a mapping of chain IDs to RPC URLs
export const RPC_URLS: { [chainId: number]: string } = {
  [mainnet.id]: getRpcUrl(mainnet.id, true),
  [arbitrum.id]: getRpcUrl(arbitrum.id, false),
  [goerli.id]: getRpcUrl(goerli.id, true),
  [arbitrumGoerli.id]: getRpcUrl(arbitrumGoerli.id, false),
};

export const AVERAGE_L1_BLOCK_TIME = 12; // ethereum blocks come in at exactly 12s +99% of the time

export type AllContracts = {
  controller: Address;
  pollCreator: Address;
  livepeerGovernor?: Address;
  bondingVotes?: Address;
  treasury?: Address;
  l1Migrator: Address;
  l2Migrator: Address;
  inbox: Address;
  outbox: Address;
  arbRetryableTx: Address;
  nodeInterface: Address;
};

const MAINNET_CONTRACTS: AllContracts = {
  controller: "0xf96d54e490317c557a967abfa5d6e33006be69b3",
  pollCreator: "0xBf824EDb6b94D9B52d972d5B25bCc19b4e6E3F3C",
  l1Migrator: "0xcC7E99a650ED63f061AC26660f2bb71570e571b2",
  l2Migrator: "0x4547918C363f5d6452b77c6233c70F31Ae41b613",
  inbox: "0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e",
  outbox: "0x2360A33905dc1c72b12d975d975F42BaBdcef9F3",
  arbRetryableTx: "0x000000000000000000000000000000000000006E",
  nodeInterface: "0x00000000000000000000000000000000000000C8",
};

const ARBITRUM_ONE_CONTRACTS: AllContracts = {
  controller: "0xD8E8328501E9645d16Cf49539efC04f734606ee4",
  pollCreator: "0x8bb50806D60c492c0004DAD5D9627DAA2d9732E6",
  l1Migrator: "0x21146B872D3A95d2cF9afeD03eE5a783DaE9A89A",
  l2Migrator: "0x148D5b6B4df9530c7C76A810bd1Cdf69EC4c2085",
  inbox: "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f",
  outbox: "0x760723CD2e632826c38Fef8CD438A4CC7E7E1A40",
  arbRetryableTx: "0x000000000000000000000000000000000000006E",
  nodeInterface: "0x00000000000000000000000000000000000000C8",
};

const ARBITRUM_GOERLI_CONTRACTS: AllContracts = {
  controller: "0x53Ea65f3E8B06d07DC1008276c5e4aa15126502B",
  pollCreator: "0x8984Fa27b8213e310e7a67B10C158aA42C0733CD",
  l1Migrator: "0xdeadbeef0deadbeef1deadbeef3deadbeef4dead", // does not exist
  l2Migrator: "0xdeadbeef0deadbeef1deadbeef3deadbeef4dead", // does not exist
  inbox: "0xdeadbeef0deadbeef1deadbeef3deadbeef4dead", // does not exist
  outbox: "0xdeadbeef0deadbeef1deadbeef3deadbeef4dead", // does not exist
  arbRetryableTx: "0x000000000000000000000000000000000000006E",
  nodeInterface: "0x00000000000000000000000000000000000000C8",
};

/**
 * List of all the networks supported by the Livepeer Explorer
 */
export const SUPPORTED_CHAINS = {
  MAINNET: mainnet,
  ARBITRUM: arbitrum,
  GOERLI: goerli,
  ARBITRUM_GOERLI: arbitrumGoerli,
};

export const L2_CHAIN_IDS = [arbitrum, arbitrumGoerli] as const;

export const L1_CHAIN_IDS = [mainnet, goerli] as const;

export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number];

export const TESTNET_CHAIN_IDS = [goerli, arbitrumGoerli] as const;

export const DEFAULT_CHAIN =
  NETWORK === "ARBITRUM_ONE"
    ? SUPPORTED_CHAINS.ARBITRUM
    : NETWORK === "ARBITRUM_GOERLI"
    ? SUPPORTED_CHAINS.ARBITRUM_GOERLI
    : NETWORK === "MAINNET"
    ? SUPPORTED_CHAINS.MAINNET
    : NETWORK === "GOERLI"
    ? SUPPORTED_CHAINS.GOERLI
    : SUPPORTED_CHAINS.ARBITRUM;

export const DEFAULT_CHAIN_ID = DEFAULT_CHAIN.id;

export const IS_TESTNET = Boolean(
  TESTNET_CHAIN_IDS.find((chain) => chain.id === DEFAULT_CHAIN.id)
);

export const IS_L2 = Boolean(
  L2_CHAIN_IDS.find((chain) => chain.id === DEFAULT_CHAIN.id)
);
export const IS_L1 = Boolean(
  L1_CHAIN_IDS.find((chain) => chain.id === DEFAULT_CHAIN.id)
);

/**
 * Array of all the supported chain IDs
 */
export const ALL_SUPPORTED_CHAIN_IDS = [
  ...L2_CHAIN_IDS,
  ...L1_CHAIN_IDS,
] as const;

/**
 * These are the network URLs used by the Livepeer Explorer when there is not another available source of chain data
 * configured in the environment variables.
 */
export const INFURA_NETWORK_URLS = RPC_URLS;

export enum NetworkType {
  L1,
  L2,
}

export const CHAIN_INFO = {
  [mainnet.id]: {
    networkType: NetworkType.L1,
    l1: mainnet,
    explorer: "https://etherscan.io/",
    explorerAPI: "https://api.etherscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Ethereum Mainnet",
    logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: RPC_URLS[mainnet.id],
    },
    subgraph:
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? `https://gateway.thegraph.com/api/${
            SUBGRAPH_KEY ?? "none"
          }/subgraphs/id/${SUBGRAPH_ID || "FDD65maya4xVfPnCjSgDRBz6UBWKAcmGtgY6BmUueJCg"}`
        : "https://gateway.thegraph.com/api/d63fd2fcf0818426ab895c6c5f6550c9/subgraphs/id/FE63YgkzcpVocxdCEyEYbvjYqEf2kb1A6daMYRxmejYC",
    contracts: MAINNET_CONTRACTS,
  },
  [goerli.id]: {
    networkType: NetworkType.L1,
    l1: goerli,
    explorer: "https://goerli.etherscan.io/",
    explorerAPI: "https://api-goerli.etherscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Goerli",
    logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Goerli Ether", symbol: "gETH", decimals: 18 },
      rpcUrl: RPC_URLS[goerli.id],
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-goerli",
    contracts: ARBITRUM_GOERLI_CONTRACTS,
  },
  [arbitrum.id]: {
    networkType: NetworkType.L2,
    l1: mainnet,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://arbiscan.io/",
    explorerAPI: "https://api.arbiscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Arbitrum",
    logoUrl: arbitrumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: RPC_URLS[arbitrum.id],
    },
    subgraph:
      `https://gateway-arbitrum.network.thegraph.com/api/${
            SUBGRAPH_KEY ?? "none"
          }/subgraphs/id/${SUBGRAPH_ID ||"FE63YgkzcpVocxdCEyEYbvjYqEf2kb1A6daMYRxmejYC"}`,
    contracts: ARBITRUM_ONE_CONTRACTS,
  },
  [arbitrumGoerli.id]: {
    networkType: NetworkType.L2,
    l1: goerli,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://testnet.arbiscan.io/",
    explorerAPI: "https://api-testnet.arbiscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Arbitrum Goerli",
    logoUrl: arbitrumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: {
        name: "Arbitrum Goerli Ether",
        symbol: "AGOR",
        decimals: 18,
      },
      rpcUrl: RPC_URLS[arbitrumGoerli.id],
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-goerli",
    contracts: ARBITRUM_GOERLI_CONTRACTS,
  },
};

export const L1_CHAIN = CHAIN_INFO[DEFAULT_CHAIN_ID].l1;

export const L1_CHAIN_ID = L1_CHAIN.id;

export const l1PublicClient = createPublicClient({
  batch: {
    multicall: {
      wait: 50,
    },
  },
  chain: L1_CHAIN as unknown as typeof mainnet,
  transport: http(RPC_URLS[L1_CHAIN_ID]),
});

export const l2PublicClient = createPublicClient({
  batch: {
    multicall: {
      wait: 50,
    },
  },
  chain: DEFAULT_CHAIN as unknown as typeof mainnet,
  transport: http(RPC_URLS[DEFAULT_CHAIN_ID]),
});

export const l1Provider = new ethers.JsonRpcProvider(
  RPC_URLS[L1_CHAIN_ID],
  undefined,
  {
    staticNetwork: true,
    polling: true,
    batchMaxCount: 1,
    cacheTimeout: -1,
  }
);

export const l2Provider = new ethers.JsonRpcProvider(
  RPC_URLS[DEFAULT_CHAIN_ID],
  undefined,
  {
    staticNetwork: true,
    polling: true,
    batchMaxCount: 1,
    cacheTimeout: -1,
  }
);

export function isL2ChainId(chainId: number | undefined): boolean {
  return L2_CHAIN_IDS.some((e) => e.id === chainId);
}
