import {
  getDefaultConfig,
  type Locale,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { _chains } from "@rainbow-me/rainbowkit/dist/config/getDefaultConfig";
import {
  baseAccount,
  braveWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import rainbowTheme from "constants/rainbowTheme";
import {
  DEFAULT_CHAIN,
  L1_CHAIN,
  NETWORK_RPC_URLS,
  WALLET_CONNECT_PROJECT_ID,
} from "lib/chains";
import { useMemo } from "react";
import { fallback, http } from "viem";
import { WagmiProvider } from "wagmi";

const Index = ({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) => {
  const config = useMemo(() => {
    const chains = (
      DEFAULT_CHAIN.id === L1_CHAIN.id
        ? [DEFAULT_CHAIN]
        : [DEFAULT_CHAIN, L1_CHAIN]
    ) as _chains;

    return getDefaultConfig({
      appName: "Livepeer Explorer",
      projectId: WALLET_CONNECT_PROJECT_ID ?? "",
      chains,
      ssr: false,
      transports: Object.fromEntries(
        chains.map((c) => [
          c.id,
          fallback((NETWORK_RPC_URLS[c.id] ?? []).map((url) => http(url))),
        ])
      ),
      wallets: [
        {
          groupName: "Popular",
          wallets: [
            metaMaskWallet,
            braveWallet,
            rainbowWallet,
            trustWallet,
            rabbyWallet,
            baseAccount,
            walletConnectWallet,
          ],
        },
      ],
    });
  }, []);

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        appInfo={{
          appName: "Livepeer Explorer",
          learnMoreUrl: "https://livepeer.org/primer",
        }}
        locale={locale as Locale}
        showRecentTransactions
        theme={rainbowTheme}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
};

export default Index;
