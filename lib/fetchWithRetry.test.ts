import { fetchWithRetry } from "./fetchWithRetry"; // <-- adjust path

// Small helper to build a minimal Response-like object
const makeRes = (overrides: Partial<Response> = {}): Response =>
  ({
    ok: true,
    status: 200,
    headers: {
      get: jest.fn().mockReturnValue(null),
      ...overrides.headers,
    },
    ...overrides,
  } as Response);

const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

describe("fetchWithRetry", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.fetch = fetchMock;
  });

  test("returns immediately when first attempt succeeds", async () => {
    const res = makeRes({ ok: true, status: 200 });
    fetchMock.mockResolvedValueOnce(res);

    const result = await fetchWithRetry("https://example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(res);
  });

  test("retries on retryable 500 and eventually succeeds", async () => {
    const first = makeRes({ ok: false, status: 500 });
    const second = makeRes({ ok: true, status: 200 });

    fetchMock.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    const result = await fetchWithRetry(
      "https://example.com",
      {},
      { retries: 2 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toBe(second);
  });

  test("does not retry on non-retryable status (e.g. 404)", async () => {
    const res404 = makeRes({ ok: false, status: 404 });
    fetchMock.mockResolvedValueOnce(res404);

    const result = await fetchWithRetry(
      "https://example.com",
      {},
      { retries: 3 }
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    // returns the 404 response directly
    expect(result).toBe(res404);
  });

  test("does not retry for non-idempotent method (POST) even on 500", async () => {
    const res500 = makeRes({ ok: false, status: 500 });
    fetchMock.mockResolvedValueOnce(res500);

    const result = await fetchWithRetry(
      "https://example.com",
      { method: "POST" },
      { retries: 3 }
    );

    // Because POST is not in the default IDEMPOTENT list, allowRetry=false
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result).toBe(res500);
  });

  test("retries on network error and throws after last attempt", async () => {
    const networkError = { name: "TypeError", message: "Network error" };

    // all attempts fail with a network error
    fetchMock.mockRejectedValue(networkError);

    await expect(
      fetchWithRetry("https://example.com", {}, { retries: 1 }) // 2 attempts total
    ).rejects.toThrow("Network error");

    // attempt 0 + attempt 1
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  test("respects user abort signal and does not retry", async () => {
    const controller = new AbortController();

    // fetch implementation that rejects with AbortError if aborted
    fetchMock.mockImplementation(
      (_input: string | URL | Request, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const sig = init?.signal as AbortSignal | undefined;
          if (!sig) {
            return reject(new Error("No signal passed"));
          }

          if (sig.aborted) {
            return reject(
              Object.assign(new Error("Aborted"), { name: "AbortError" })
            );
          }

          sig.addEventListener(
            "abort",
            () => {
              reject(
                Object.assign(new Error("Aborted"), { name: "AbortError" })
              );
            },
            { once: true }
          );
        })
    );

    // Immediately abort before/while the request is in flight
    const promise = fetchWithRetry(
      "https://example.com",
      { signal: controller.signal },
      { retries: 3 }
    );

    controller.abort();

    await expect(promise).rejects.toHaveProperty("name", "AbortError");

    // Should not retry after user abort
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
