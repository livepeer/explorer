import { advance, type Cursor, FIRST_CURSOR } from "./paging";

const r = (id: string, timestamp: number) => ({ id, timestamp });
const ids = (rows: { id: string }[]) => rows.map((x) => x.id);

/** Simulate a subgraph: rows at or before `before`, newest first, skipped. */
function read(
  source: Record<string, { id: string; timestamp: number }[]>,
  cursor: Cursor,
  first: number
) {
  const out: Record<string, { id: string; timestamp: number }[]> = {};
  for (const [c, rows] of Object.entries(source)) {
    if (cursor.done.includes(c)) continue;
    out[c] = rows
      .filter((x) => x.timestamp <= cursor.before)
      .sort((a, b) => b.timestamp - a.timestamp || (a.id < b.id ? -1 : 1))
      .slice(cursor.skip[c] ?? 0)
      .slice(0, first);
  }
  return out;
}

/** Page through everything, returning ids in the order shown. */
function pageAll(
  source: Record<string, { id: string; timestamp: number }[]>,
  first: number
) {
  const seen: string[] = [];
  let cursor: Cursor | null = FIRST_CURSOR;
  for (let i = 0; cursor && i < 100; i++) {
    const { shown, next } = advance(read(source, cursor, first), cursor, first);
    seen.push(...ids(shown));
    cursor = next;
  }
  return seen;
}

describe("advance", () => {
  it("shows everything when no collection is full", () => {
    const { shown, next } = advance(
      { a: [r("a1", 30), r("a2", 10)], b: [r("b1", 20)] },
      FIRST_CURSOR,
      5
    );
    expect(ids(shown)).toEqual(["a1", "b1", "a2"]);
    expect(next).toBeNull();
  });

  it("stops where a full collection may be hiding older rows", () => {
    const { shown, next } = advance(
      {
        a: [r("a1", 40), r("a2", 30), r("a3", 20)],
        b: [r("b1", 35), r("b2", 15)],
      },
      FIRST_CURSOR,
      3
    );
    expect(ids(shown)).toEqual(["a1", "b1", "a2", "a3"]);
    expect(next).toEqual({ before: 20, skip: { a: 1, b: 0 }, done: [] });
  });

  it("pages every row exactly once across collections", () => {
    const source = {
      a: Array.from({ length: 23 }, (_, i) => r(`a${i}`, 1000 - i * 7)),
      b: Array.from({ length: 9 }, (_, i) => r(`b${i}`, 1000 - i * 19)),
    };
    const seen = pageAll(source, 5);
    expect(seen.sort()).toEqual(
      [...source.a, ...source.b].map((x) => x.id).sort()
    );
  });

  it("gets through a batch sharing one timestamp, larger than a page", () => {
    // 12 tickets redeemed in one transaction, pages of 5.
    const source = {
      tickets: [
        r("t-new", 500),
        ...Array.from({ length: 12 }, (_, i) => r(`t${i}`, 400)),
        r("t-old", 300),
      ],
      rewards: [r("r1", 450), r("r2", 350)],
    };
    const seen = pageAll(source, 5);
    expect(seen).toHaveLength(16);
    expect(new Set(seen).size).toBe(16);
    expect(seen.indexOf("t-old")).toBeGreaterThan(seen.indexOf("t11"));
  });
});
