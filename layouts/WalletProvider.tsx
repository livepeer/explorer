import { useMemo, useEffect, useState } from "react";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

type Props = {
  children: React.ReactNode;
  chains: any[];
  projectId: string;
  locale?: string | null;
};

export default function WalletProvidersClient({
  children,
  chains,
  projectId,
  locale,
}: Props) {
  // Import RainbowKit and your theme ONLY on the client
  const {
    getDefaultConfig,
    RainbowKitProvider,
  } = require("@rainbow-me/rainbowkit");
  const rainbowTheme = require("constants/rainbowTheme").default;

  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "Livepeer Explorer",
        projectId,
        chains,
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
        theme={rainbowTheme}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
