import { SUBGRAPH_URL } from "@/lib/config";

export class SubgraphError extends Error {}

export async function querySubgraph<T>(
  query: string,
  variables: Record<string, unknown> = {},
  signal?: AbortSignal
): Promise<T> {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    signal,
  });
  if (!res.ok) {
    throw new SubgraphError(`Subgraph request failed (${res.status})`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new SubgraphError(json.errors[0].message);
  }
  return json.data as T;
}

const PAGE = 1000;

/**
 * Walk a collection with id-cursor pagination (`id_gt`), which unlike `skip`
 * stays fast past the first few thousand rows. The query must accept
 * `$first` and `$lastId` and filter on `id_gt: $lastId`.
 *
 * More than `max` rows throws rather than return a partial list that reads
 * as complete, since callers sum these into balances and history. It only
 * throws once a row past `max` has actually been read, so exactly `max` is
 * fine. A caller that can work with a sample passes `partial: true`, gets
 * the first `max`, and checks the length against `max` itself.
 */
export async function paginate<Row extends { id: string }>(
  query: string,
  key: string,
  variables: Record<string, unknown> = {},
  { max = 100_000, partial = false }: { max?: number; partial?: boolean } = {}
): Promise<Row[]> {
  const rows: Row[] = [];
  let lastId = "";
  for (;;) {
    const data = await querySubgraph<Record<string, Row[]>>(query, {
      ...variables,
      first: PAGE,
      lastId,
    });
    const page = data[key] ?? [];
    rows.push(...page);
    if (rows.length > max) {
      if (partial) return rows.slice(0, max);
      throw new SubgraphError(
        `More than ${max.toLocaleString()} ${key} to load; stopping rather than show incomplete data`
      );
    }
    if (page.length < PAGE) break;
    lastId = page[page.length - 1].id;
  }
  return rows;
}
