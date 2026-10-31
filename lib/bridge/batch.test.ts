import { inBatches, MAX_ADDRESSES } from "./batch";

const addresses = (n: number) =>
  Array.from({ length: n }, (_, i) => `0x${i.toString(16).padStart(40, "0")}`);

describe("inBatches", () => {
  it("asks once for a portfolio within the limit", async () => {
    const fetchBatch = jest.fn(async (b: string[]) => b);
    const out = await inBatches(addresses(5), fetchBatch, (x) => x);
    expect(fetchBatch).toHaveBeenCalledTimes(1);
    expect(out).toHaveLength(5);
  });

  it("splits a bigger portfolio, never over the limit, and loses nothing", async () => {
    const all = addresses(45);
    const fetchBatch = jest.fn(async (b: string[]) => b);
    const out = await inBatches(all, fetchBatch, (x) => x);
    expect(fetchBatch).toHaveBeenCalledTimes(3);
    for (const [b] of fetchBatch.mock.calls) {
      expect(b.length).toBeLessThanOrEqual(MAX_ADDRESSES);
    }
    expect(out.sort()).toEqual([...all].sort());
  });

  it("keeps a transfer between two batches' addresses once", async () => {
    const transfer = { id: "7", from: "a", to: "b" };
    const out = await inBatches(
      addresses(25),
      async () => [transfer],
      (t) => t.id
    );
    expect(out).toEqual([transfer]);
  });
});
