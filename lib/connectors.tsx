import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";
import { WalletLinkConnector } from "@web3-react/walletlink-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";
import {
  ALL_SUPPORTED_CHAIN_IDS,
  INFURA_NETWORK_URLS,
  SupportedChainId,
} from "../constants/chains";

export const network = new NetworkConnector({
  urls: INFURA_NETWORK_URLS,
  defaultChainId: 1,
});

export const injected = new InjectedConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
});

// mainnet only
export const walletlink = new WalletLinkConnector({
  url: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
  appName: "Livepeer Explorer",
  appLogoUrl: "https://explorer.livepeer.org/img/logo-icon.svg",
  supportedChainIds: [SupportedChainId.MAINNET],
});

export const walletconnect = new WalletConnectConnector({
  supportedChainIds: ALL_SUPPORTED_CHAIN_IDS,
  rpc: INFURA_NETWORK_URLS,
  qrcode: true,
});
