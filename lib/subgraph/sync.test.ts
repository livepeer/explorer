import { QueryClient } from "@tanstack/react-query";

import { refreshWhenIndexed, waitForIndexed } from "./sync";

function mockIndexedBlocks(blocks: number[]) {
  let i = 0;
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      data: {
        _meta: { block: { number: blocks[Math.min(i++, blocks.length - 1)] } },
      },
    }),
  })) as unknown as typeof fetch;
}

describe("waitForIndexed", () => {
  it("resolves once the subgraph reaches the block", async () => {
    mockIndexedBlocks([90, 95, 100]);
    await expect(waitForIndexed(100n, { intervalMs: 0 })).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it("gives up on a request that never answers", async () => {
    // Settles only when aborted, like a stalled connection.
    global.fetch = jest.fn(
      (_url: unknown, init?: { signal?: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        })
    ) as unknown as typeof fetch;
    await expect(
      waitForIndexed(100, { intervalMs: 0, timeoutMs: 50 })
    ).resolves.toBe(false);
  });

  it("gives up after the timeout", async () => {
    mockIndexedBlocks([90]);
    await expect(
      waitForIndexed(100, { intervalMs: 0, timeoutMs: 20 })
    ).resolves.toBe(false);
  });
});

describe("refreshWhenIndexed", () => {
  it("invalidates only after indexing catches up", async () => {
    mockIndexedBlocks([99, 100]);
    const client = new QueryClient();
    const spy = jest.spyOn(client, "invalidateQueries");
    await refreshWhenIndexed(client, 100n, [["portfolio"], ["events"]]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith({ queryKey: ["portfolio"] });
    expect(spy).toHaveBeenCalledWith({ queryKey: ["events"] });
  });
});
