import { paginate, querySubgraph, SubgraphError } from "./client";

/** A collection of `total` rows, served 1,000 at a time by id. */
function mockRows(total: number) {
  global.fetch = jest.fn(async (_url: unknown, init?: { body?: string }) => {
    const { variables } = JSON.parse(init?.body ?? "{}");
    const after = variables.lastId ? Number(variables.lastId) : -1;
    const count = Math.max(0, Math.min(variables.first, total - after - 1));
    const rows = Array.from({ length: count }, (_, i) => ({
      id: String(after + 1 + i),
    }));
    return { ok: true, json: async () => ({ data: { items: rows } }) };
  }) as unknown as typeof fetch;
}

describe("paginate", () => {
  it("reads every page", async () => {
    mockRows(2500);
    await expect(paginate("q", "items")).resolves.toHaveLength(2500);
  });

  it("throws at the cap rather than return a partial list", async () => {
    mockRows(3500);
    await expect(paginate("q", "items", {}, { max: 2000 })).rejects.toThrow(
      SubgraphError
    );
  });

  it("reads exactly the cap without calling it incomplete", async () => {
    mockRows(2000);
    await expect(
      paginate("q", "items", {}, { max: 2000 })
    ).resolves.toHaveLength(2000);
  });

  it("returns what it has at the cap when partial results are fine", async () => {
    mockRows(3500);
    await expect(
      paginate("q", "items", {}, { max: 2000, partial: true })
    ).resolves.toHaveLength(2000);
  });
});

/** A fetch that never answers, and fails only when its signal aborts. */
function hangingFetch() {
  return jest.spyOn(global, "fetch").mockImplementation(
    (_url, init) =>
      new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) return reject(signal.reason);
        signal?.addEventListener("abort", () => reject(signal.reason));
      })
  );
}

describe("querySubgraph", () => {
  afterEach(() => jest.restoreAllMocks());

  it("gives up on a stalled request with a subgraph error", async () => {
    hangingFetch();
    // The deadline has passed by the time the request is made.
    jest
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(
        AbortSignal.abort(new DOMException("timed out", "TimeoutError"))
      );
    await expect(querySubgraph("{ x }")).rejects.toBeInstanceOf(SubgraphError);
  });

  it("still lets the caller cancel", async () => {
    hangingFetch();
    jest
      .spyOn(AbortSignal, "timeout")
      .mockReturnValue(new AbortController().signal);
    const caller = new AbortController();
    const pending = querySubgraph("{ x }", {}, caller.signal);
    caller.abort(new DOMException("left the page", "AbortError"));
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
