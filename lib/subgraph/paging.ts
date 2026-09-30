/**
 * Paging several event collections newest first, as one list.
 *
 * Each collection is read with `timestamp_lte: before` and a `skip`, and the
 * page shows everything down to the most recent point where a full
 * collection might still be hiding older rows. Timestamps alone can't page:
 * a batch of ticket redemptions shares one timestamp, often more than a
 * page's worth, so each collection also remembers how many rows at `before`
 * it has already shown.
 */

export type Cursor = {
  before: number;
  /** Rows at `before` already shown, per collection. */
  skip: Record<string, number>;
  /** Collections with nothing left to read. */
  done: string[];
};

export const FIRST_CURSOR: Cursor = {
  before: 2 ** 31 - 1,
  skip: {},
  done: [],
};

type Row = { timestamp: number | string };

export function advance<R extends Row>(
  data: Record<string, R[]>,
  cursor: Cursor,
  first: number
): { shown: R[]; next: Cursor | null } {
  const ts = (r: R) => Number(r.timestamp);
  const collections = Object.keys(data);
  const full = collections.filter((c) => data[c].length >= first);

  // Below the oldest row of a full collection, it may have rows we haven't
  // read: show only down to the latest such point.
  const bound = full.length
    ? Math.max(...full.map((c) => ts(data[c][data[c].length - 1])))
    : -Infinity;
  const shown = collections
    .flatMap((c) => data[c])
    .filter((r) => ts(r) >= bound)
    .sort((a, b) => ts(b) - ts(a));
  if (!full.length) return { shown, next: null };

  const skip: Record<string, number> = {};
  const done = [...cursor.done];
  for (const c of collections) {
    const rows = data[c];
    const atBound = rows.filter((r) => ts(r) === bound).length;
    const deferred = rows.some((r) => ts(r) < bound);
    // A short collection whose rows were all shown is finished.
    if (rows.length < first && !deferred) {
      done.push(c);
      continue;
    }
    const carried = cursor.before === bound ? cursor.skip[c] ?? 0 : 0;
    skip[c] = carried + atBound;
  }
  return { shown, next: { before: bound, skip, done } };
}
