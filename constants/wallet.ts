import { injected, walletlink, walletconnect } from "@lib/connectors";
import MetaMaskIcon from "../public/img/metamask.svg";
import CoinbaseWalletIcon from "../public/img/coinbase-wallet.svg";
import WalletConnectIcon from "../public/img/wallet-connect.svg";
import InjectedIcon from "../public/img/arrow-right.svg";

export const SUPPORTED_WALLETS = {
  INJECTED: {
    connector: injected,
    name: "Injected",
    icon: InjectedIcon,
    description: "Injected web3 provider.",
    href: null,
    color: "#010101",
    primary: true,
  },
  METAMASK: {
    connector: injected,
    name: "MetaMask",
    icon: MetaMaskIcon,
    description: "Easy-to-use browser extension.",
    href: null,
    color: "#E8831D",
  },
  WALLET_CONNECT: {
    connector: walletconnect,
    name: "WalletConnect",
    icon: WalletConnectIcon,
    description: "Connect to Trust Wallet, Rainbow Wallet and more...",
    href: null,
    color: "#4196FC",
    mobile: true,
  },
  WALLET_LINK: {
    connector: walletlink,
    name: "Coinbase Wallet",
    icon: CoinbaseWalletIcon,
    description: "Use Coinbase Wallet app on mobile device",
    href: null,
    color: "#315CF5",
  },
  COINBASE_LINK: {
    name: "Open in Coinbase Wallet",
    icon: CoinbaseWalletIcon,
    description: "Open in Coinbase Wallet app.",
    href: "https://go.cb-w.com/0T8By93MA4",
    color: "#315CF5",
    mobile: true,
    mobileOnly: true,
  },
};
