import { fetcher } from "@lib/axios";
import { ApolloProvider } from "@apollo/client";
import { IdProvider } from "@radix-ui/react-id";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import Layout from "layouts/main";
import { DEFAULT_CHAIN, WALLET_CONNECT_PROJECT_ID, L1_CHAIN } from "lib/chains";
import Head from "next/head";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { CookiesProvider } from "react-cookie";
import { SWRConfig } from "swr";
import { useApollo } from "../apollo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";

const WalletProviders = dynamic(() => import("layouts/WalletProvider"), {
  ssr: false,
});

const queryClient = new QueryClient();

function App({ Component, pageProps, fallback = null }) {
  const client = useApollo();
  const { route, locale } = useRouter();

  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const { chains, layoutKey } = useMemo(() => {
    const chainsArr = [isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN];
    return {
      chains: chainsArr,
      layoutKey: chainsArr.map((e) => e.id).join(","),
    };
  }, [isMigrateRoute]);

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Explorer</title>
      </Head>
      <ApolloProvider key={layoutKey} client={client}>
        <TooltipPrimitive.Provider>
          <QueryClientProvider client={queryClient}>
            <WalletProviders
              chains={chains}
              projectId={WALLET_CONNECT_PROJECT_ID ?? ""}
              locale={locale}
            >
              <SWRConfig
                value={{
                  loadingTimeout: 40000,
                  fetcher,
                  fallback: fallback ?? {},
                }}
              >
                <CookiesProvider>
                  <IdProvider>
                    {getLayout(<Component {...pageProps} />)}
                  </IdProvider>
                </CookiesProvider>
              </SWRConfig>
            </WalletProviders>
          </QueryClientProvider>
        </TooltipPrimitive.Provider>
      </ApolloProvider>
    </>
  );
}

export default App;
