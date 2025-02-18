import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import Head from "next/head";
import Layout from "layouts/main";
import { useRouter } from "next/router";
import { useMemo } from "react";
import rainbowTheme from "constants/rainbowTheme";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { SUPPORTED_CHAINS } from "lib/chains";
import { ApolloProvider } from "@apollo/client";
import { SWRConfig } from "swr";
import { fetcher } from "@lib/axios";
import { useApollo } from "../apollo";

import "@rainbow-me/rainbowkit/styles.css";

// Use string literals for environment variables to ensure they're replaced during build

// Helper function to get RPC URL with fallback
const getRpcUrl = (customUrl: string | undefined, infuraPath: string): string => {
  if (customUrl && customUrl.startsWith('http')) {
    return customUrl;
  }
  return `https://${infuraPath}.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`;
};

const wagmiConfig = getDefaultConfig({
  appName: "Livepeer Explorer",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID ?? "",
  chains: [SUPPORTED_CHAINS.MAINNET, SUPPORTED_CHAINS.ARBITRUM],
  transports: {
    [SUPPORTED_CHAINS.MAINNET.id]: http(
      getRpcUrl(process.env.NEXT_PUBLIC_L1_RPC_URL, 'mainnet')
    ),
    [SUPPORTED_CHAINS.ARBITRUM.id]: http(
      getRpcUrl(process.env.NEXT_PUBLIC_L2_RPC_URL, 'arbitrum-mainnet')
    ),
  },
});

const queryClient = new QueryClient();

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const { route } = useRouter();
  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  const apolloClient = useApollo();

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Explorer</title>
      </Head>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider theme={rainbowTheme}>
            <ThemeProvider 
              attribute="class" 
              defaultTheme="system" 
              enableSystem={true}
              enableColorScheme={true}
              storageKey="livepeer-theme"
              disableTransitionOnChange
            >
              <TooltipPrimitive.Provider>
                <ApolloProvider client={apolloClient}>
                  <SWRConfig value={{ fetcher }}>
                    {getLayout(<Component {...pageProps} />)}
                  </SWRConfig>
                </ApolloProvider>
              </TooltipPrimitive.Provider>
            </ThemeProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}

export default App;
