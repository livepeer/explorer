import useSWR from "swr";

// How often the client re-checks the shared subgraph-health signal, in ms.
const HEALTH_POLL_INTERVAL = 60_000;

/**
 * Polls the server-side drift check (/api/subgraph-health) and returns true when
 * Explorer data may be stale because the subgraph is behind chain head.
 */
export const useSubgraphDegraded = (): boolean => {
  const { data } = useSWR<{ degraded: boolean }>("/subgraph-health", {
    refreshInterval: HEALTH_POLL_INTERVAL,
  });

  return data?.degraded === true;
};
