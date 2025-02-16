import { fetcher } from "@lib/axios";
import { ApolloProvider } from "@apollo/client";
import { IdProvider } from "@radix-ui/react-id";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import rainbowTheme from "constants/rainbowTheme";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Layout from "layouts/main";
import { DEFAULT_CHAIN, WALLET_CONNECT_PROJECT_ID, INFURA_KEY, L1_CHAIN } from "lib/chains";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { CookiesProvider } from "react-cookie";
import { SWRConfig } from "swr";
import { Chain, configureChains, createConfig, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { useApollo } from "../apollo";

function App({ Component, pageProps, fallback = null }) {
  const client = useApollo();

  const { route } = useRouter();

  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const { config, chains, layoutKey } = useMemo(() => {
    const currentChain = isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN;
    
    // Custom RPC first (chain-specific)
    const customRpcUrl = isMigrateRoute 
      ? process.env.NEXT_PUBLIC_L1_RPC_URL 
      : process.env.NEXT_PUBLIC_L2_RPC_URL;

    const providers = [
      ...(customRpcUrl
        ? [
            jsonRpcProvider({
              rpc: () => ({
                http: customRpcUrl,
              }),
            }),
          ]
        : []),
      // Infura as fallback if available
      ...(INFURA_KEY ? [infuraProvider({ apiKey: INFURA_KEY })] : []),
      // Public provider as final fallback
      publicProvider(),
    ];

    const { chains, publicClient } = configureChains(
      [currentChain as Chain],
      providers
    );

    const { connectors } = getDefaultWallets({
      appName: "Livepeer Explorer",
      projectId: WALLET_CONNECT_PROJECT_ID ?? "",
      chains,
    });

    const config = createConfig({
      autoConnect: true,
      connectors,
      publicClient,
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
        <TooltipPrimitive.Provider>
          <WagmiConfig config={config}>
            <RainbowKitProvider
              showRecentTransactions={true}
              appInfo={{
                appName: "Livepeer Explorer",
                learnMoreUrl: "https://livepeer.org/primer",
              }}
              theme={rainbowTheme}
              chains={chains}
            >
              <SWRConfig
                value={{
                  loadingTimeout: 40000,
                  fetcher: fetcher,
                  fallback: fallback ?? {},
                }}
              >
                <CookiesProvider>
                  <IdProvider>
                    {getLayout(<Component {...pageProps} />)}
                  </IdProvider>
                </CookiesProvider>
              </SWRConfig>
            </RainbowKitProvider>
          </WagmiConfig>
        </TooltipPrimitive.Provider>
      </ApolloProvider>
    </>
  );
}

export default App;
