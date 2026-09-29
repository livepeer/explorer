import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { querySubgraph } from "./client";

const INDEXED_BLOCK = /* GraphQL */ `
  query IndexedBlock {
    _meta {
      block {
        number
      }
    }
  }
`;

/** Latest block the subgraph has indexed, or null if it can't say. */
export async function fetchIndexedBlock(): Promise<number | null> {
  try {
    const data = await querySubgraph<{ _meta: { block: { number: number } } }>(
      INDEXED_BLOCK
    );
    return Number(data._meta.block.number);
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Resolve once the subgraph has indexed `block`. Returns false on timeout.
 * A confirmed receipt only means the chain has the transaction; the
 * subgraph typically trails it by a few seconds.
 */
export async function waitForIndexed(
  block: bigint | number,
  { timeoutMs = 120_000, intervalMs = 2_000 } = {}
): Promise<boolean> {
  const target = Number(block);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const indexed = await fetchIndexedBlock();
    if (indexed != null && indexed >= target) return true;
    await sleep(intervalMs);
  }
  return false;
}

/**
 * Refetch `keys` once the subgraph has caught up with `block`. Runs outside
 * React so it finishes even if the dialog that started it has closed.
 */
export async function refreshWhenIndexed(
  queryClient: QueryClient,
  block: bigint | number | undefined,
  keys: QueryKey[]
): Promise<boolean> {
  const indexed = block == null ? false : await waitForIndexed(block);
  await Promise.all(
    keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))
  );
  return indexed;
}
