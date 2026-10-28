import { refetchUntil } from "./live-read";

describe("refetchUntil", () => {
  it("stops as soon as the value catches up", async () => {
    const reads = [0n, 0n, 5n, 5n];
    const refetch = jest.fn(async () => ({ data: reads.shift() }));
    const ok = await refetchUntil(refetch, (a) => (a ?? 0n) >= 5n, {
      delayMs: 0,
    });
    expect(ok).toBe(true);
    expect(refetch).toHaveBeenCalledTimes(3);
  });

  it("gives up after its tries", async () => {
    const refetch = jest.fn(async () => ({ data: 0n }));
    const ok = await refetchUntil(refetch, (a) => (a ?? 0n) >= 5n, {
      tries: 4,
      delayMs: 0,
    });
    expect(ok).toBe(false);
    expect(refetch).toHaveBeenCalledTimes(4);
  });
});
