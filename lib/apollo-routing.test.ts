/** @jest-environment node */

import type { ApolloClient, NormalizedCacheObject } from "@apollo/client";
import { gql } from "@apollo/client";

// Next resolves this baseUrl import; Jest's aliases only cover @lib imports.
jest.mock(
  "lib/chains",
  () => ({
    DEFAULT_CHAIN_ID: 42161,
    CHAIN_INFO: {
      42161: { subgraph: "https://gateway.example/api/dummy-key/subgraph" },
    },
  }),
  { virtual: true }
);

describe("Apollo request routing", () => {
  const originalFetch = global.fetch;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  it.each([
    ["server", "https://gateway.example/api/dummy-key/subgraph"],
    ["browser", "/api/graphql"],
  ])("routes %s requests to %s", async (environment, expectedUrl) => {
    fetchMock.mockReset().mockResolvedValue(
      new Response(JSON.stringify({ data: { value: "ok" } }), {
        headers: { "Content-Type": "application/json" },
      })
    );
    global.fetch = fetchMock;
    if (environment === "browser") {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: {},
      });
    }

    let client!: ApolloClient<NormalizedCacheObject>;
    await jest.isolateModulesAsync(async () => {
      client = (await import("../apollo")).client;
    });

    try {
      const result = await client.query({
        query: gql`
          query RoutingTest {
            value
          }
        `,
      });

      expect(result.data).toEqual({ value: "ok" });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl);
    } finally {
      client.stop();
    }
  });
});
