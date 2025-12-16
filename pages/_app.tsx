import "@rainbow-me/rainbowkit/styles.css";

import { ApolloProvider } from "@apollo/client";
import { fetcher } from "@lib/axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "layouts/main";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import numbro from "numbro";
import { Tooltip } from "radix-ui";
import { useMemo } from "react";
import { CookiesProvider } from "react-cookie";
import { SWRConfig } from "swr";

import { useApollo } from "../apollo";

numbro.setDefaults({ spaceSeparated: false });

const queryClient = new QueryClient();

const Web3Providers = dynamic(() => import("../components/Web3Providers"), {
  ssr: false,
});

function App({ Component, pageProps, fallback = null }) {
  const client = useApollo();
  const { route, locale } = useRouter();

  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Explorer</title>
      </Head>

      <ApolloProvider client={client}>
        <Tooltip.Provider>
          <QueryClientProvider client={queryClient}>
            <Web3Providers isMigrateRoute={isMigrateRoute} locale={locale}>
              <SWRConfig
                value={{
                  loadingTimeout: 40000,
                  fetcher,
                  fallback: fallback ?? {},
                }}
              >
                <CookiesProvider>
                  {getLayout(<Component {...pageProps} />)}
                </CookiesProvider>
              </SWRConfig>
            </Web3Providers>
          </QueryClientProvider>
        </Tooltip.Provider>
      </ApolloProvider>
    </>
  );
}

export default App;
