import {
  getDefaultConfig,
  type Locale,
  RainbowKitProvider,
  type Wallet,
} from "@rainbow-me/rainbowkit";
import {
  baseAccount,
  braveWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  safeWallet,
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
import { createConnector, WagmiProvider } from "wagmi";
import { safe } from "wagmi/connectors";

// RainbowKit's safeWallet, but only trusting Safe{Wallet} as the parent page;
// otherwise any site embedding the explorer can fake the Safe handshake.
const safeAppWallet = (): Wallet => ({
  ...safeWallet(),
  createConnector: (walletDetails) =>
    createConnector((config) => ({
      ...safe({ allowedDomains: [/^https:\/\/app\.safe\.global$/] })(config),
      ...walletDetails,
    })),
});

const Index = ({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: string;
}) => {
  const config = useMemo(() => {
    const chains =
      DEFAULT_CHAIN.id === L1_CHAIN.id
        ? ([DEFAULT_CHAIN] as const)
        : ([DEFAULT_CHAIN, L1_CHAIN] as const);
    // Safe Apps run in Safe{Wallet}'s iframe; list Safe first so reconnect picks it.
    const isSafeApp = typeof window !== "undefined" && window.parent !== window;

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
            ...(isSafeApp ? [safeAppWallet] : []),
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
