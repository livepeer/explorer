/** @jest-environment node */

import type { NextApiRequest, NextApiResponse } from "next";

import handler, { config } from "../../pages/api/graphql";

jest.mock("@lib/chains", () => ({
  DEFAULT_CHAIN_ID: 42161,
  CHAIN_INFO: {
    42161: { subgraph: "https://gateway.example/api/dummy-key/subgraph" },
  },
}));

const upstreamUrl = "https://gateway.example/api/dummy-key/subgraph";
const originalFetch = global.fetch;
const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
const operation = {
  query: "query Example($id: ID!) { thing(id: $id) { id } }",
  operationName: "Example",
  variables: { id: "123" },
};

const request = (overrides: Partial<NextApiRequest> = {}) =>
  ({
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: operation,
    query: {},
    ...overrides,
  } as NextApiRequest);

const response = () => {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as typeof res & NextApiResponse;
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("GraphQL proxy", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  it("forwards the operation only to the configured upstream with safe headers", async () => {
    const result = { data: { thing: { id: "123" } } };
    fetchMock.mockResolvedValue(jsonResponse(result));
    const res = response();

    await handler(
      request({
        headers: {
          "content-type": "application/json",
          cookie: "session=private",
          authorization: "Bearer caller-token",
          host: "attacker.example",
        },
        query: { upstream: "https://attacker.example" },
      }),
      res
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/graphql-response+json, application/json",
      },
      body: JSON.stringify(operation),
      redirect: "error",
      credentials: "omit",
      signal: expect.any(AbortSignal),
    });
    expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-store");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it.each([
    { data: { thing: null }, errors: [{ message: "Thing unavailable" }] },
    {
      errors: [{ message: "Unknown query", extensions: { code: "BAD_QUERY" } }],
    },
    { data: null, extensions: { tracing: {} } },
  ])("preserves GraphQL response fields: %j", async (result) => {
    fetchMock.mockResolvedValue(jsonResponse(result));
    const res = response();

    await handler(request(), res);

    expect(res.json).toHaveBeenCalledWith(result);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("preserves non-2xx GraphQL errors and accepts GraphQL response JSON", async () => {
    const result = { errors: [{ message: "Invalid query" }] };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(result), {
        status: 400,
        headers: { "Content-Type": "application/graphql-response+json" },
      })
    );
    const res = response();

    await handler(request(), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  it("accepts optional null operation fields", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null }));

    await handler(
      request({
        body: { query: "{ _meta { block { number } } }", variables: null },
      }),
      response()
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each(["GET", "OPTIONS", "PUT", undefined])(
    "rejects the %s method before contacting the upstream",
    async (method) => {
      const res = response();

      await handler(request({ method }), res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.setHeader).toHaveBeenCalledWith("Allow", "POST");
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    undefined,
    "text/plain",
    "application/graphql",
    "application/jsonp",
  ])("rejects unsupported Content-Type %s", async (contentType) => {
    const res = response();

    await handler(request({ headers: { "content-type": contentType } }), res);

    expect(res.status).toHaveBeenCalledWith(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    null,
    [],
    [operation],
    "invalid JSON",
    {},
    { query: " " },
    { query: 1 },
    { ...operation, variables: [] },
    { ...operation, variables: "invalid" },
    { ...operation, operationName: 5 },
    { ...operation, extensions: "invalid" },
    { ...operation, upstream: "https://attacker.example" },
  ])("rejects an invalid request envelope: %j", async (body) => {
    const res = response();

    await handler(request({ body }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("limits parsed bodies and configures the same limit for the JSON parser", async () => {
    expect(config.api.bodyParser.sizeLimit).toBe("64kb");
    const res = response();

    await handler(
      request({
        body: { ...operation, variables: { text: "é".repeat(32768) } },
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(413);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    new Response(upstreamUrl, { status: 502 }),
    new Response("<html>upstream failure</html>", {
      status: 500,
      headers: { "Content-Type": "text/html" },
    }),
    jsonResponse({ message: upstreamUrl }, 500),
    jsonResponse([]),
    jsonResponse({ data: "invalid" }),
    jsonResponse({ errors: [{ debug: upstreamUrl }] }),
    jsonResponse({ data: {}, errors: [] }),
    jsonResponse({ data: {} }, 302),
    new Response(upstreamUrl, {
      headers: { "Content-Type": "application/json" },
    }),
  ])("sanitizes invalid upstream protocol responses (%#)", async (upstream) => {
    fetchMock.mockResolvedValue(upstream);
    const res = response();

    await handler(request(), res);

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      errors: [
        {
          message: expect.stringMatching(
            /^Invalid subgraph response$|^Subgraph request failed$/
          ),
        },
      ],
    });
    expect(JSON.stringify(res.json.mock.calls)).not.toContain("dummy-key");
  });

  it("sanitizes network and redirect failures without logging the upstream URL", async () => {
    fetchMock.mockRejectedValue(new Error(`Failed to fetch ${upstreamUrl}`));
    const res = response();
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      await handler(request(), res);

      expect(res.status).toHaveBeenCalledWith(502);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ message: "Subgraph request failed" }],
      });
      expect(errorLog).not.toHaveBeenCalled();
    } finally {
      errorLog.mockRestore();
    }
  });

  it.each(["fetch", "body"])(
    "aborts a stalled upstream %s and returns a sanitized timeout",
    async (stage) => {
      jest.useFakeTimers();
      fetchMock.mockImplementation((_url, options) => {
        const stalled = () =>
          new Promise<never>((_resolve, reject) => {
            options?.signal?.addEventListener("abort", () =>
              reject(new Error(`Aborted ${upstreamUrl}`))
            );
          });
        if (stage === "fetch") return stalled();
        const upstream = jsonResponse({ data: null });
        jest.spyOn(upstream, "json").mockImplementation(stalled);
        return Promise.resolve(upstream);
      });
      const res = response();

      const pending = handler(request(), res);
      await jest.advanceTimersByTimeAsync(10_000);
      await pending;

      expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
      expect(res.status).toHaveBeenCalledWith(504);
      expect(res.json).toHaveBeenCalledWith({
        errors: [{ message: "Subgraph request timed out" }],
      });
      expect(jest.getTimerCount()).toBe(0);
    }
  );
});
