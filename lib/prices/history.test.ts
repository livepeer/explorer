import { pageOf, parseCandles, priceAt } from "./history";

jest.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

const H = Date.UTC(2026, 0, 1, 12) / 1000; // an hour boundary

describe("price history", () => {
  it("reads Coinbase candles, keeping each hour's open", () => {
    const m = parseCandles([
      [H + 3600, 5.0, 5.4, 5.2, 5.3, 1000],
      [H, 4.9, 5.1, 5.0, 5.2, 1200],
      [H + 7200, 0, 0, 0, 0, 0], // no trading: dropped
    ]);
    expect(m!.get(H)).toBe(5.0);
    expect(m!.get(H + 3600)).toBe(5.2);
    expect(m!.size).toBe(2);
    expect(parseCandles({ message: "NotFound" })).toBeNull();
  });

  it("prices a moment at the nearest hour", () => {
    const m = new Map([
      [H, 5],
      [H + 3600, 6],
    ]);
    expect(priceAt(m, H + 20 * 60)).toBe(5);
    expect(priceAt(m, H + 40 * 60)).toBe(6);
    // Nearest hour missing: the closest one with trades, up to 3h away.
    expect(priceAt(m, H - 50 * 60)).toBe(5);
    expect(priceAt(m, H + 4 * 3600)).toBe(6);
    expect(priceAt(m, H + 5 * 3600)).toBeNull();
  });

  it("puts every hour in a fixed page of 300", () => {
    expect(pageOf(0)).toBe(0);
    expect(pageOf(299 * 3600)).toBe(0);
    expect(pageOf(300 * 3600)).toBe(1);
  });
});

describe("pricesAt", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("reads the pages around each moment, retrying a rate limit", async () => {
    const calls: string[] = [];
    let limited = false;
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url));
      calls.push(u.pathname);
      if (!limited) {
        limited = true;
        return Response.json({ message: "Slow down" }, { status: 429 });
      }
      const start = Date.parse(u.searchParams.get("start")!) / 1000;
      const end = Date.parse(u.searchParams.get("end")!) / 1000;
      const rows: number[][] = [];
      for (let t = end; t >= start; t -= 3600)
        rows.push([t, 1, 2, t / 3600, 1.5, 10]);
      return Response.json(rows);
    }) as typeof fetch;

    const { pricesAt } = await import("./history");
    const t = H + 35 * 60; // nearest hour: H + 1h
    const [p] = await pricesAt("LPT", [t]);
    expect(p).toBe((H + 3600) / 3600);
    expect(calls.every((c) => c === "/products/LPT-USD/candles")).toBe(true);
  }, 10_000);
});

describe("pricesAt with a failing page", () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it("prices what it can and leaves the rest null", async () => {
    const bad = Date.UTC(2025, 0, 1) / 1000;
    global.fetch = jest.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url));
      const start = Date.parse(u.searchParams.get("start")!) / 1000;
      const end = Date.parse(u.searchParams.get("end")!) / 1000;
      if (bad >= start && bad <= end)
        return Response.json({ message: "not found" }, { status: 404 });
      const rows: number[][] = [];
      for (let t = end; t >= start; t -= 3600) rows.push([t, 1, 2, 7, 1.5, 10]);
      return Response.json(rows);
    }) as typeof fetch;

    const { pricesAt } = await import("./history");
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const [good, missing] = await pricesAt("ETH", [H, bad]);
    expect(good).toBe(7);
    expect(missing).toBeNull();
    warn.mockRestore();
  }, 20_000);
});
