import { useMemo } from "react";
import { WagmiProvider } from "wagmi";

import "@rainbow-me/rainbowkit/styles.css";

type Props = {
  children: React.ReactNode;
  chains: any[];
  projectId: string;
  locale?: string | null;
  theme: any;
};

export default function WalletProvidersClient({
  children,
  chains,
  projectId,
  locale,
  theme,
}: Props) {
  // require inside to avoid server import during SSR
  const { getDefaultConfig, RainbowKitProvider } = require("@rainbow-me/rainbowkit");

  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "Livepeer Explorer",
        projectId,
        chains,
        // explicitly disable SSR path for rainbowkit
        ssr: false,
      }),
    [chains, projectId]
  );

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider
        appInfo={{
          appName: "Livepeer Explorer",
          learnMoreUrl: "https://livepeer.org/primer",
        }}
        locale={locale ?? undefined}
        showRecentTransactions
        theme={theme}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
