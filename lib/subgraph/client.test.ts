import { querySubgraph, SubgraphError } from "./client";

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
