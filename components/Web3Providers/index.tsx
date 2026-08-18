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
import { DEFAULT_CHAIN, L1_CHAIN, WALLET_CONNECT_PROJECT_ID } from "lib/chains";
import { useMemo } from "react";
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
