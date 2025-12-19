import {
  getDefaultConfig,
  type Locale,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { _chains } from "@rainbow-me/rainbowkit/dist/config/getDefaultConfig";
import rainbowTheme from "constants/rainbowTheme";
import { DEFAULT_CHAIN, L1_CHAIN, WALLET_CONNECT_PROJECT_ID } from "lib/chains";
import { useMemo } from "react";
import { WagmiProvider } from "wagmi";

const Index = ({
  children,
  isMigrateRoute,
  locale,
}: {
  children: React.ReactNode;
  isMigrateRoute: boolean;
  locale?: string;
}) => {
  const { config, layoutKey } = useMemo(() => {
    const chains = [isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN] as _chains;

    const config = getDefaultConfig({
      appName: "Livepeer Explorer",
      projectId: WALLET_CONNECT_PROJECT_ID ?? "",
      chains,
      ssr: false,
    });

    return {
      config,
      layoutKey: chains.map((e) => e.id).join(","),
    };
  }, [isMigrateRoute]);

  return (
    <WagmiProvider config={config} key={layoutKey}>
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
