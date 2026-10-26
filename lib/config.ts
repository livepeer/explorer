import { arbitrum, mainnet } from "viem/chains";

/**
 * The Livepeer subgraph with the fields the portfolio needs: delegator
 * `shares`, per-round `DelegatorSnapshot`s, and cumulative reward/fee
 * factors on every pool (livepeer/subgraph#217).
 *
 * Served by The Graph's gateway with an API key, at the subgraph's id,
 * which follows its latest published version. To hold on one version
 * instead (say, while a newly published one is still syncing), set
 * NEXT_PUBLIC_SUBGRAPH_DEPLOYMENT to its deployment id (Qm…).
 */
const SUBGRAPH_ID = "8BAy1zU5zAd5VXQEU6yh16PpCgrJ2E5SMrnP6M91uGK6";
const SUBGRAPH_DEPLOYMENT = process.env.NEXT_PUBLIC_SUBGRAPH_DEPLOYMENT;
const SUBGRAPH_KEY = process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY;

/**
 * Without a key: Studio's rate-limited query URL, for local development
 * only. A production build without a key or endpoint fails instead (see
 * next.config.js), so this never ships as if it were production data.
 */
export const STAGING_SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/20534/livepeer-staging/v0.0.15";

export const SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_SUBGRAPH_ENDPOINT ||
  (SUBGRAPH_KEY
    ? SUBGRAPH_DEPLOYMENT
      ? `https://gateway.thegraph.com/api/${SUBGRAPH_KEY}/deployments/id/${SUBGRAPH_DEPLOYMENT}`
      : `https://gateway.thegraph.com/api/${SUBGRAPH_KEY}/subgraphs/id/${SUBGRAPH_ID}`
    : STAGING_SUBGRAPH_URL);

/**
 * Reown (formerly WalletConnect) project. v2 has its own, so its domains can
 * be allowlisted without touching the one explorer.livepeer.org uses; the
 * shared one stands in until it's set.
 */
export const WALLET_CONNECT_PROJECT_ID =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ||
  process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ||
  "";

const INFURA_KEY = process.env.NEXT_PUBLIC_INFURA_KEY;

export const L2_CHAIN = arbitrum;
export const L1_CHAIN = mainnet;

export const RPC_URLS: Record<number, string[]> = {
  [arbitrum.id]: [
    process.env.NEXT_PUBLIC_L2_RPC_URL,
    INFURA_KEY && `https://arbitrum-mainnet.infura.io/v3/${INFURA_KEY}`,
    "https://arb1.arbitrum.io/rpc",
  ].filter(Boolean) as string[],
  [mainnet.id]: [
    process.env.NEXT_PUBLIC_L1_RPC_URL,
    INFURA_KEY && `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    // Keyless public endpoints; cloudflare-eth.com has been shut down.
    "https://ethereum-rpc.publicnode.com",
    "https://eth.llamarpc.com",
  ].filter(Boolean) as string[],
};

export const CONTRACTS = {
  controller: "0xD8E8328501E9645d16Cf49539efC04f734606ee4",
  pollCreator: "0x8bb50806D60c492c0004DAD5D9627DAA2d9732E6",
} as const;

/**
 * Livepeer's contracts on Arbitrum One, as the Controller registers them.
 * These are proxies: an upgrade changes the code behind them, not the
 * address. Transactions only ever go to these; the registry is read as a
 * cross-check, so a lying RPC can't swap in its own contract.
 */
export const PROTOCOL_CONTRACTS = {
  BondingManager: "0x35Bcf3c30594191d53231E4FF333E8A770453e40",
  LivepeerToken: "0x289ba1701C2F088cf0faf8B3705246331cB8A839",
  RoundsManager: "0xdd6f56DcC28D3F5f27084381fE8Df634985cc39f",
  LivepeerGovernor: "0xcFE4E2879B786C3aa075813F0E364bb5acCb6aa0",
  BondingVotes: "0x0B9C254837E72Ebe9Fe04960C43B69782E68169A",
  Treasury: "0xf82C1FF415F1fCf582554fDba790E27019c8E8C4",
} as const;

export type ProtocolContractName = keyof typeof PROTOCOL_CONTRACTS;

/**
 * Livepeer's L2Migrator on Arbitrum, which holds stake and fees delegated on
 * Ethereum before the move to Arbitrum (LIP-73) until each delegator claims
 * them. Not registered in the Controller, so it's pinned here.
 */
export const L2_MIGRATOR = "0x148D5b6B4df9530c7C76A810bd1Cdf69EC4c2085";

export const BLOCK_EXPLORER = "https://arbiscan.io";

export const txUrl = (hash: string) => `${BLOCK_EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) =>
  `${BLOCK_EXPLORER}/address/${address}`;
