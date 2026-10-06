"use client";

import "@rainbow-me/rainbowkit/styles.css";

import {
  darkTheme,
  getDefaultConfig,
  RainbowKitProvider,
  type Theme,
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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { fallback, http } from "viem";
import { createConnector, WagmiProvider } from "wagmi";
import { safe } from "wagmi/connectors";

import { Analytics } from "@/components/analytics";
import { StakingProvider } from "@/components/staking/staking";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  L1_CHAIN,
  L2_CHAIN,
  RPC_URLS,
  WALLET_CONNECT_PROJECT_ID,
} from "@/lib/config";
import { AddressMemory } from "@/lib/hooks/watchlist";

import { ThemeProvider } from "./theme";

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

function makeWagmiConfig() {
  if (!WALLET_CONNECT_PROJECT_ID && typeof window !== "undefined") {
    // WalletConnect (and wallets that fall back to it, like Trust without
    // its extension) can't connect without a project ID; say so plainly.
    console.warn(
      "Livepeer Explorer: NEXT_PUBLIC_REOWN_PROJECT_ID was not set when this build was made, so WalletConnect won't connect."
    );
  }
  const isSafeApp = typeof window !== "undefined" && window.parent !== window;
  return getDefaultConfig({
    appName: "Livepeer Explorer",
    projectId: WALLET_CONNECT_PROJECT_ID || "livepeer-explorer",
    // L1 is only read from (ENS); staking happens on Arbitrum.
    chains: [L2_CHAIN, L1_CHAIN],
    ssr: true,
    transports: {
      [L2_CHAIN.id]: fallback(
        RPC_URLS[L2_CHAIN.id].map((u) => http(u, { batch: true }))
      ),
      [L1_CHAIN.id]: fallback(
        RPC_URLS[L1_CHAIN.id].map((u) => http(u, { batch: true }))
      ),
    },
    wallets: [
      {
        groupName: "Popular",
        wallets: [
          ...(isSafeApp ? [safeAppWallet] : []),
          metaMaskWallet,
          rabbyWallet,
          rainbowWallet,
          braveWallet,
          trustWallet,
          baseAccount,
          walletConnectWallet,
        ],
      },
    ],
  });
}

/**
 * RainbowKit injects its theme as CSS variables, so pointing them at the
 * registry tokens makes the modal follow our light/dark switch for free.
 */
const base = darkTheme();
const rainbowTheme: Theme = {
  ...base,
  colors: {
    ...base.colors,
    accentColor: "var(--primary)",
    accentColorForeground: "var(--primary-foreground)",
    actionButtonBorder: "var(--border)",
    actionButtonBorderMobile: "var(--border)",
    actionButtonSecondaryBackground: "var(--secondary)",
    closeButton: "var(--muted-foreground)",
    closeButtonBackground: "var(--secondary)",
    connectButtonBackground: "var(--secondary)",
    connectButtonInnerBackground: "var(--muted)",
    connectButtonText: "var(--foreground)",
    generalBorder: "var(--border)",
    generalBorderDim: "var(--hairline)",
    menuItemBackground: "var(--hover)",
    modalBackdrop: "var(--overlay)",
    modalBackground: "var(--popover)",
    modalBorder: "var(--border)",
    modalText: "var(--foreground)",
    modalTextDim: "var(--subtle-foreground)",
    modalTextSecondary: "var(--muted-foreground)",
    profileAction: "var(--secondary)",
    profileActionHover: "var(--accent)",
    profileForeground: "var(--popover)",
    selectedOptionBorder: "var(--ring)",
    standby: "var(--warm)",
    connectionIndicator: "var(--green-bright)",
    error: "var(--destructive)",
  },
  fonts: { body: "var(--font-sans)" },
  radii: {
    actionButton: "6px",
    connectButton: "6px",
    menuButton: "6px",
    modal: "14px",
    modalMobile: "14px",
  },
  shadows: {
    ...base.shadows,
    dialog: "var(--shadow-popover)",
    connectButton: "none",
    profileDetailsAction: "none",
    selectedOption: "none",
    selectedWallet: "none",
    walletLogo: "none",
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [wagmiConfig] = useState(makeWagmiConfig);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 2 },
        },
      })
  );

  return (
    <ThemeProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            theme={rainbowTheme}
            initialChain={L2_CHAIN}
            appInfo={{
              appName: "Livepeer Explorer",
              learnMoreUrl: "https://docs.livepeer.org/delegators",
            }}
          >
            <TooltipProvider>
              <StakingProvider>
                <AddressMemory />
                <Analytics />
                {children}
              </StakingProvider>
            </TooltipProvider>
            <Toaster
              position="bottom-center"
              theme="system"
              toastOptions={{
                className: "font-sans text-sm",
                style: {
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  color: "var(--popover-foreground)",
                  boxShadow: "var(--shadow-popover)",
                },
              }}
            />
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
