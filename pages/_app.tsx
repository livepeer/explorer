import { fetcher } from "@lib/axios";
import { ApolloProvider } from "@apollo/client";
import { IdProvider } from "@radix-ui/react-id";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import rainbowTheme from "constants/rainbowTheme";
import Layout from "layouts/main";
import { DEFAULT_CHAIN, INFURA_KEY, L1_CHAIN } from "lib/chains";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { CookiesProvider } from "react-cookie";
import { SWRConfig } from "swr";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { infuraProvider } from "wagmi/providers/infura";
import { publicProvider } from "wagmi/providers/public";
import { useApollo } from "../apollo";

function App({ Component, pageProps, fallback = null }) {
  const client = useApollo();

  const { route } = useRouter();

  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const { wagmiClient, chains, layoutKey } = useMemo(() => {
    const { provider, chains } = configureChains(
      [isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN],
      [infuraProvider({ infuraId: INFURA_KEY }), publicProvider()]
    );

    const { connectors } = getDefaultWallets({
      appName: "Livepeer",
      chains,
    });

    const wagmiClient = createClient({
      autoConnect: true,
      connectors,
      provider,
    });

    return {
      wagmiClient,
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
        <WagmiConfig client={wagmiClient}>
          <RainbowKitProvider
            showRecentTransactions={true}
            appInfo={{
              appName: "Livepeer",
              learnMoreUrl: "https://livepeer.org/primer",
            }}
            theme={rainbowTheme}
            chains={chains}
          >
            <SWRConfig
              value={{
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
      </ApolloProvider>
    </>
  );
}

export default App;
