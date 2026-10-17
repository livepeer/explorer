/** @jest-environment node */

import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { addTypenameToDocument } from "@apollo/client/utilities";
import { type DocumentNode, getOperationAST, print } from "graphql";
import type { NextApiRequest, NextApiResponse } from "next";

import * as subgraph from "../../apollo/subgraph";
import handler from "../../pages/api/graphql";

jest.mock("../chains", () => ({
  DEFAULT_CHAIN_ID: 42161,
  CHAIN_INFO: {
    42161: { subgraph: "https://gateway.example/api/dummy-key/subgraph" },
  },
}));

const upstreamUrl = "https://gateway.example/api/dummy-key/subgraph";
const originalFetch = global.fetch;
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;
const operation = {
  query: print(subgraph.ProtocolByBlockDocument),
  operationName: "protocolByBlock",
  variables: { block: { number: 123 } },
};
const documents = Object.entries(subgraph)
  .filter(([name]) => name.endsWith("Document"))
  .map(([, document]) => document as DocumentNode);
const approvedForms = documents.flatMap((document) =>
  [document, addTypenameToDocument(document)].map((form, index) => ({
    operationName: getOperationAST(form)!.name!.value,
    form: index === 0 ? "source" : "Apollo",
    query: print(form),
  }))
);

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
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
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

  it.each(approvedForms)("accepts $operationName ($form)", async (body) => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null }));
    const { query, operationName } = body;
    const res = response();

    await handler(request({ body: { query, operationName } }), res);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it.each([
    undefined,
    null,
    {},
    { first: null, skip: null },
    { first: 0, skip: 0 },
    { first: 1000, skip: Number.MAX_SAFE_INTEGER },
  ])(
    "preserves valid, nullable and omitted pagination: %j",
    async (variables) => {
      fetchMock.mockResolvedValue(jsonResponse({ data: null }));
      const body = { ...operation, variables };
      const res = response();

      await handler(request({ body }), res);

      expect(fetchMock.mock.calls[0][1]!.body).toBe(JSON.stringify(body));
      expect(res.status).toHaveBeenCalledWith(200);
    }
  );

  it.each([
    { first: -1 },
    { first: 1.5 },
    { first: "1" },
    { first: 1001 },
    { skip: -1 },
    { skip: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects invalid pagination before fetching: %j", async (variables) => {
    const res = response();

    await handler(request({ body: { ...operation, variables } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["server", "browser"])(
    "routes the configured %s Apollo client and accepts its wire payload",
    async (environment) => {
      const data = {
        _meta: { block: { number: 123 }, hasIndexingErrors: false },
      };
      fetchMock.mockResolvedValue(jsonResponse({ data }));
      const routedFetch = jest.fn(
        async (url: RequestInfo | URL, options?: RequestInit) => {
          if (url !== "/api/graphql") return fetchMock(url, options);
          const res = response();
          await handler(
            request({ body: JSON.parse(options!.body as string) }),
            res
          );
          return jsonResponse(
            res.json.mock.calls[0][0],
            res.status.mock.calls[0][0]
          );
        }
      );
      global.fetch = routedFetch;
      if (environment === "browser") {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          value: {},
        });
      }
      let client!: ApolloClient<NormalizedCacheObject>;
      await jest.isolateModulesAsync(async () => {
        client = (await import("../../apollo")).client;
      });

      try {
        const result = await client.query({
          query: subgraph.MetaDocument,
          fetchPolicy: "no-cache",
        });

        expect(result.data).toEqual(data);
        expect(routedFetch.mock.calls[0][0]).toBe(
          environment === "browser" ? "/api/graphql" : upstreamUrl
        );
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const sentBody = routedFetch.mock.calls[0][1]!.body as string;
        expect(sentBody).toContain("__typename");
        expect(fetchMock.mock.calls[0][1]!.body).toBe(sentBody);
      } finally {
        client.stop();
      }
    }
  );

  it("ignores whitespace and comments when matching the complete document", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null }));

    await handler(
      request({
        body: {
          ...operation,
          query: `# operation\n${operation.query.replace(
            /\n/g,
            "\n# comment\n  "
          )}`,
        },
      }),
      response()
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    { query: operation.query },
    {
      query: operation.query,
      operationName: null,
      variables: null,
      extensions: null,
    },
    { ...operation, extensions: {} },
  ])("accepts omitted, null and empty optional fields (%#)", async (body) => {
    fetchMock.mockResolvedValue(jsonResponse({ data: null }));

    await handler(request({ body }), response());

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    [
      "altered fields",
      operation.query.replace("totalVolumeUSD", "totalSupply"),
    ],
    [
      "altered alias",
      operation.query.replace("totalVolumeUSD", "stolen: totalVolumeUSD"),
    ],
    ["altered literal", operation.query.replace("id: 0", "id: 1")],
    [
      "altered variable definition",
      operation.query.replace("$block: Block_height", "$block: Block_height!"),
    ],
    [
      "added directive",
      operation.query.replace(
        "totalVolumeUSD",
        "totalVolumeUSD @skip(if: true)"
      ),
    ],
    [
      "additional operation",
      `${operation.query}\nquery Other { _meta { hasIndexingErrors } }`,
    ],
    ["extra fragment", `${operation.query}\nfragment Extra on Protocol { id }`],
    ["unknown query", "query Unknown { _meta { hasIndexingErrors } }"],
    ["anonymous query", print(subgraph.MetaDocument).replace("query meta", "")],
    ["malformed query", "query protocolByBlock {"],
    ["mutation", operation.query.replace("query ", "mutation ")],
    ["subscription", operation.query.replace("query ", "subscription ")],
    [
      "introspection",
      "query protocolByBlock { __schema { queryType { name } } }",
    ],
  ])("rejects %s without contacting the upstream", async (_label, query) => {
    const res = response();

    await handler(request({ body: { ...operation, query } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["GET", "OPTIONS"])(
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
    [operation],
    "invalid JSON",
    {},
    { query: " " },
    { query: 1 },
    { ...operation, variables: [] },
    { ...operation, operationName: 5 },
    { ...operation, operationName: "meta" },
    { ...operation, operationName: "" },
    { ...operation, extensions: "invalid" },
    {
      ...operation,
      extensions: { persistedQuery: { version: 1, sha256Hash: "untrusted" } },
    },
    { ...operation, extensions: { tracing: true } },
    { ...operation, upstream: "https://attacker.example" },
  ])("rejects an invalid request envelope: %j", async (body) => {
    const res = response();

    await handler(request({ body }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
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
