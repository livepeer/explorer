import "../css/flickity.css";
import "react-circular-progressbar/dist/styles.css";
import Head from "next/head";
import { Web3ReactProvider } from "@web3-react/core";
import { ethers } from "ethers";
import { CookiesProvider } from "react-cookie";
import Web3ReactManager from "../components/Web3ReactManager";
import Layout from "layouts/main";
import { useApollo } from "../core/apollo";
import { ApolloProvider } from "@apollo/client";

function getLibrary(provider) {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = 10000;
  return library;
}

function App({ Component, pageProps }) {
  const client = useApollo(pageProps.initialApolloState);
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);
  return (
    <>
      <Head>
        <title>Livepeer Explorer</title>
      </Head>
      <ApolloProvider client={client}>
        <Web3ReactProvider getLibrary={getLibrary}>
          <Web3ReactManager>
            <CookiesProvider>
              {getLayout(<Component {...pageProps} />)}
            </CookiesProvider>
          </Web3ReactManager>
        </Web3ReactProvider>
      </ApolloProvider>
    </>
  );
}

export default App;
