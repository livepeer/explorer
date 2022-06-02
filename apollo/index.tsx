import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import merge from "lodash.merge";
import { useMemo } from "react";
import createApolloClient from "./createApolloClient";

export const client = new ApolloClient({
  link: new HttpLink({
    uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
  }),
  cache: new InMemoryCache(),
});

let apolloClient;

export function getApollo(initialState = null) {
  const _apolloClient: ApolloClient<{}> = apolloClient ?? createApolloClient({}, null);

  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Combine
    const data = merge(initialState, existingCache);

    _apolloClient.cache.restore(data);
  }

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === "undefined") {
    return _apolloClient;
  }

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;

  return _apolloClient;
}

export function useApollo(initialState) {
  const store = useMemo(() => getApollo(initialState), [initialState]);
  return store;
}
