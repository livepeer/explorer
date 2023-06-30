import ethereumLogoUrl from "../public/img/logos/ethereum.png";
import arbitrumLogoUrl from "../public/img/logos/arbitrum.png";
import { ethers } from "ethers";

import * as chain from "@wagmi/core/chains";

export const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

export const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;
const NETWORK = process.env.NEXT_PUBLIC_NETWORK;

const SUBGRAPH_KEY = process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY;

if (typeof INFURA_KEY === "undefined" || typeof NETWORK === "undefined") {
  throw new Error(
    `NEXT_PUBLIC_INFURA_KEY and NETWORK must be defined environment variables`
  );
}

export const AVERAGE_L1_BLOCK_TIME = 12; // ethereum blocks come in at exactly 12s +99% of the time

export type AllContracts = {
  controller: string;
  pollCreator: string;
  l1Migrator: string;
  l2Migrator: string;
  inbox: string;
  outbox: string;
  arbRetryableTx: string;
  nodeInterface: string;
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

const RINKEBY_CONTRACTS: AllContracts = {
  controller: "0x9a9827455911a858E55f07911904fACC0D66027E",
  pollCreator: "0x6749dFa7990Aa27E0B82dCD735C8100BC711AeE7",
  l1Migrator: "0x4756766C61e0755db5963Ab3505280Ddf1B36cD8",
  l2Migrator: "0x35e813A271ba1146B8C0Ed2837DD0b4577C7ffA8",
  inbox: "0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e",
  outbox: "0x2360A33905dc1c72b12d975d975F42BaBdcef9F3",
  arbRetryableTx: "0x000000000000000000000000000000000000006E",
  nodeInterface: "0x00000000000000000000000000000000000000C8",
};

const ARBITRUM_RINKEBY_CONTRACTS: AllContracts = {
  controller: "0x9ceC649179e2C7Ab91688271bcD09fb707b3E574",
  pollCreator: "0x7e3305D48489e43B7fBf318D575D5dF654EE175c",
  l1Migrator: "0x4756766C61e0755db5963Ab3505280Ddf1B36cD8",
  l2Migrator: "0xe2f931931B8E04a01c99a2DeBA44A9FF782F688a",
  inbox: "0x578BAde599406A8fE3d24Fd7f7211c0911F5B29e",
  outbox: "0x2360A33905dc1c72b12d975d975F42BaBdcef9F3",
  arbRetryableTx: "0x000000000000000000000000000000000000006E",
  nodeInterface: "0x00000000000000000000000000000000000000C8",
};

/**
 * List of all the networks supported by the Livepeer Explorer
 */
export const L2_CHAIN_IDS = [chain.arbitrum, chain.arbitrumGoerli] as const;

export const L1_CHAIN_IDS = [chain.mainnet, chain.goerli] as const;

export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number];

export const TESTNET_CHAIN_IDS = [chain.goerli, chain.arbitrumGoerli] as const;

export const DEFAULT_CHAIN =
  NETWORK === "ARBITRUM_ONE"
    ? chain.arbitrum
    : NETWORK === "ARBITRUM_GOERLI"
    ? chain.arbitrumGoerli
    : NETWORK === "MAINNET"
    ? chain.mainnet
    : NETWORK === "GOERLI"
    ? chain.goerli
    : chain.arbitrum;

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
 */
export const INFURA_NETWORK_URLS = {
  [chain.mainnet.id]: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
  // [chain.goerli.id]: `https://rinkeby.infura.io/v3/${INFURA_KEY}`,
  [chain.arbitrum.id]: `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
  // [chain.arbitrumGoerli
  //   .id]: `https://arbitrum-rinkeby.infura.io/v3/${INFURA_KEY}`,
};

export enum NetworkType {
  L1,
  L2,
}

export const CHAIN_INFO = {
  [chain.mainnet.id]: {
    networkType: NetworkType.L1,
    l1: chain.mainnet,
    explorer: "https://etherscan.io/",
    explorerAPI: "https://api.etherscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Ethereum Mainnet",
    logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: INFURA_NETWORK_URLS[chain.mainnet.id],
    },
    subgraph:
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? `https://gateway.thegraph.com/api/${
            SUBGRAPH_KEY ?? "none"
          }/subgraphs/id/FDD65maya4xVfPnCjSgDRBz6UBWKAcmGtgY6BmUueJCg`
        : "https://api.thegraph.com/subgraphs/name/livepeer/livepeer",
    contracts: MAINNET_CONTRACTS,
  },
  // TODO this needs to be updated
  [chain.goerli.id]: {
    networkType: NetworkType.L1,
    l1: chain.goerli,
    explorer: "https://rinkeby.etherscan.io/",
    explorerAPI: "https://api-rinkeby.etherscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Rinkeby",
    logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Rinkeby Ether", symbol: "rETH", decimals: 18 },
      rpcUrl: INFURA_NETWORK_URLS[chain.goerli.id],
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/livepeer-rinkeby",
    contracts: RINKEBY_CONTRACTS,
  },
  [chain.arbitrum.id]: {
    networkType: NetworkType.L2,
    l1: chain.mainnet,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://arbiscan.io/",
    explorerAPI: "https://api.arbiscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Arbitrum",
    logoUrl: arbitrumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrl: "https://arb1.arbitrum.io/rpc",
    },
    subgraph:
      process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
        ? `https://gateway-arbitrum.network.thegraph.com/api/${
            SUBGRAPH_KEY ?? "none"
          }/subgraphs/id/FE63YgkzcpVocxdCEyEYbvjYqEf2kb1A6daMYRxmejYC`
        : "https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-one",
    contracts: ARBITRUM_ONE_CONTRACTS,
  },
  [chain.arbitrumGoerli.id]: {
    networkType: NetworkType.L2,
    l1: chain.goerli,
    bridge: "https://bridge.arbitrum.io/",
    docs: "https://offchainlabs.com/",
    explorer: "https://testnet.arbiscan.io/",
    explorerAPI: "https://api-testnet.arbiscan.io/api",
    pricingUrl: "https://nyc.livepeer.com/orchestratorStats",
    label: "Arbitrum Rinkeby",
    logoUrl: arbitrumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: {
        name: "Arbitrum Rinkeby Ether",
        symbol: "ARETH",
        decimals: 18,
      },
      rpcUrl: "https://rinkeby.arbitrum.io/rpc",
    },
    subgraph:
      "https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-rinkeby",
    contracts: ARBITRUM_RINKEBY_CONTRACTS,
  },
};

export const L1_CHAIN = CHAIN_INFO[DEFAULT_CHAIN_ID].l1;

export const L1_CHAIN_ID = L1_CHAIN.id;

export const l1Provider = new ethers.providers.JsonRpcProvider(
  INFURA_NETWORK_URLS[L1_CHAIN_ID]
);

export const l2Provider = new ethers.providers.JsonRpcProvider(
  INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID]
);

export function isL2ChainId(chainId: number | undefined): boolean {
  return L2_CHAIN_IDS.some((e) => e.id === chainId);
}
