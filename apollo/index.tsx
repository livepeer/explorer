import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { persistCache, LocalStorageWrapper } from "apollo3-cache-persist";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { useEffect, useMemo, useState } from "react";

export * from "./subgraph";

const cache = new InMemoryCache();

// Persist the Apollo cache to localStorage so finished proposal data
// survives full page reloads without refetching from the subgraph.
export const cachePersistPromise =
  typeof window !== "undefined"
    ? persistCache({
        cache,
        storage: new LocalStorageWrapper(window.localStorage),
        maxSize: 1048576, // 1 MB
      })
    : Promise.resolve();

export const client = new ApolloClient({
  link: new HttpLink({
    uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
  }),
  cache,
});

export function getApollo() {
  return client;
}

export function useApollo() {
  const store = useMemo(() => getApollo(), []);
  return store;
}

/** Wait for the persisted cache to restore before rendering queries. */
export function useApolloReady() {
  const [ready, setReady] = useState(typeof window === "undefined");
  useEffect(() => {
    cachePersistPromise.then(() => setReady(true));
  }, []);
  return ready;
}
