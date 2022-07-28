import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useMemo } from "react";

export * from "./subgraph";

export const client = new ApolloClient({
  link: new HttpLink({
    uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
  }),
  cache: new InMemoryCache(),
});

export function getApollo() {
  return client;
}

export function useApollo() {
  const store = useMemo(() => getApollo(), []);
  return store;
}
