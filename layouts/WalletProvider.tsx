import "@rainbow-me/rainbowkit/styles.css";

type Props = {
  children: React.ReactNode;
  chains: any[];
  projectId: string;
  locale?: string | null;
};

export default function WalletProviders({
  children,
  chains,
  projectId,
  locale,
}: Props) {
  // Import RainbowKit + Wagmi + theme ONLY when this module runs (client).
  const {
    getDefaultConfig,
    RainbowKitProvider,
  } = require("@rainbow-me/rainbowkit");
  const { WagmiProvider } = require("wagmi");
  const rainbowTheme = require("constants/rainbowTheme").default;

  const config = getDefaultConfig({
    appName: "Livepeer Explorer",
    projectId,
    chains,
    ssr: false, // be explicit
  });

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
