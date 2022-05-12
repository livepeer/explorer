import { ApolloProvider } from "@apollo/client";
import { IdProvider } from "@radix-ui/react-id";
import {
  configureChains,
  apiProvider,
  getDefaultWallets,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { L1_CHAIN, DEFAULT_CHAIN, INFURA_KEY } from "lib/chains";
import rainbowTheme from "constants/rainbowTheme";
import Layout from "layouts/main";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";
import "react-circular-progressbar/dist/styles.css";
import { CookiesProvider } from "react-cookie";
import { createClient, WagmiProvider } from "wagmi";
import { useApollo } from "../apollo";
import "../css/flickity.css";

function App({ Component, pageProps }) {
  const client = useApollo(pageProps.initialApolloState);

  const { route } = useRouter();

  const { wagmiClient, chains } = useMemo(() => {
    const { provider, chains } = configureChains(
      [route.includes("/migrate") ? L1_CHAIN : DEFAULT_CHAIN],
      [apiProvider.infura(INFURA_KEY), apiProvider.fallback()]
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

    return { wagmiClient, chains };
  }, [route]);

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Explorer</title>
      </Head>
      <ApolloProvider client={client}>
        <WagmiProvider client={wagmiClient}>
          <RainbowKitProvider
            showRecentTransactions={false}
            appInfo={{
              appName: "Livepeer",
              learnMoreUrl: "https://livepeer.org/primer",
            }}
            theme={rainbowTheme}
            chains={chains}
          >
            <CookiesProvider>
              <IdProvider>{getLayout(<Component {...pageProps} />)}</IdProvider>
            </CookiesProvider>{" "}
          </RainbowKitProvider>
        </WagmiProvider>
      </ApolloProvider>
    </>
  );
}

export default App;
