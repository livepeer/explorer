import { ApolloProvider } from "@apollo/client";
import { fetcher } from "@lib/axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_CHAIN, L1_CHAIN } from "lib/chains";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useRouter } from "next/router";
import numbro from "numbro";
import { Tooltip } from "radix-ui";
import { useMemo } from "react";
import { CookiesProvider } from "react-cookie";
import { SWRConfig } from "swr";

import { useApollo } from "../apollo";

const CreateLayout = dynamic(() => import("../layouts/main"), { ssr: false });

const queryClient = new QueryClient();

numbro.setDefaults({
  spaceSeparated: false,
});

function App({ Component, pageProps, fallback = null }) {
  const client = useApollo();

  const { route } = useRouter();
  const isMigrateRoute = useMemo(() => route.includes("/migrate"), [route]);

  const chains = [isMigrateRoute ? L1_CHAIN : DEFAULT_CHAIN];

  const getLayout =
    Component.getLayout || ((page) => <CreateLayout>{page}</CreateLayout>);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Livepeer Explorer</title>
      </Head>
      <ApolloProvider
        key={chains.map((e) => e.id).join(",")} // triggers a re-render of the entire app, to make sure that the chains are not memo-ized incorrectly
        client={client}
      >
        <Tooltip.Provider>
          <QueryClientProvider client={queryClient}>
            {/* <RainbowKitProvider
                appInfo={{
                  appName: "Livepeer Explorer",
                  learnMoreUrl: "https://livepeer.org/primer",
                }}
                locale={locale as Locale}
                showRecentTransactions={true}
                theme={rainbowTheme}
              > */}
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
            {/* </RainbowKitProvider> */}
          </QueryClientProvider>
        </Tooltip.Provider>
      </ApolloProvider>
    </>
  );
}

export default App;
