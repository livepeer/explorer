import "@rainbow-me/rainbowkit/styles.css";

import { ApolloProvider } from "@apollo/client";
import { fetcher } from "@lib/axios";
import {
  getDefaultConfig,
  type Locale,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { _chains } from "@rainbow-me/rainbowkit/dist/config/getDefaultConfig";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import rainbowTheme from "constants/rainbowTheme";
import Layout from "layouts/main";
import { DEFAULT_CHAIN, L1_CHAIN, WALLET_CONNECT_PROJECT_ID } from "lib/chains";
import Head from "next/head";
import { useRouter } from "next/router";
import numbro from "numbro";
import { Tooltip } from "radix-ui";
import { useMemo } from "react";
import { CookiesProvider } from "react-cookie";
import { SWRConfig } from "swr";
import { WagmiProvider } from "wagmi";

import { useApollo } from "../apollo";

const queryClient = new QueryClient();

numbro.setDefaults({
  spaceSeparated: false,
});

function App({ Component, pageProps, fallback = null }) {
  const client = useApollo();

  const { route, locale } = useRouter();

  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const { config, layoutKey } = useMemo(() => {
    const chains = [isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN] as _chains;

    const config = getDefaultConfig({
      appName: "Livepeer Explorer",
      projectId: WALLET_CONNECT_PROJECT_ID ?? "",
      chains,
      ssr: true,
    });

    return {
      config,
      chains,
      layoutKey: chains.map((e) => e.id).join(","),
    };
  }, [isMigrateRoute]);

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Explorer</title>
      </Head>
      <ApolloProvider
        key={layoutKey} // triggers a re-render of the entire app, to make sure that the chains are not memo-ized incorrectly
        client={client}
      >
        <Tooltip.Provider>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider
                appInfo={{
                  appName: "Livepeer Explorer",
                  learnMoreUrl: "https://livepeer.org/primer",
                }}
                locale={locale as Locale}
                showRecentTransactions={true}
                theme={rainbowTheme}
              >
                <SWRConfig
                  value={{
                    loadingTimeout: 40000,
                    fetcher: fetcher,
                    fallback: fallback ?? {},
                  }}
                >
                  <CookiesProvider>
                    {getLayout(<Component {...pageProps} />)}
                  </CookiesProvider>
                </SWRConfig>
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </Tooltip.Provider>
      </ApolloProvider>
    </>
  );
}

export default App;
