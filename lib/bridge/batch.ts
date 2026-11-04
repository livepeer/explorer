/** The bridge APIs take at most this many addresses per request. */
export const MAX_ADDRESSES = 20;

/**
 * Fetches a list for any number of addresses, MAX_ADDRESSES at a time, and
 * merges the answers. A transfer between two of the addresses can come back
 * from two requests, so each is kept once, by `key`.
 */
export async function inBatches<T>(
  addresses: string[],
  fetchBatch: (batch: string[]) => Promise<T[]>,
  key: (item: T) => string
): Promise<T[]> {
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += MAX_ADDRESSES) {
    batches.push(addresses.slice(i, i + MAX_ADDRESSES));
  }
  const lists = await Promise.all(batches.map(fetchBatch));
  const seen = new Map<string, T>();
  for (const item of lists.flat()) {
    const k = key(item);
    if (!seen.has(k)) seen.set(k, item);
  }
  return [...seen.values()];
}
