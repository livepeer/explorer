/** @jest-environment node */

describe("subgraph configuration", () => {
  const originalEnv = process.env;
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const missingConfigMessage =
    "SUBGRAPH_API_KEY or SUBGRAPH_ENDPOINT must be defined as an environment variable";

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_INFURA_KEY: "test-infura-key",
      NEXT_PUBLIC_NETWORK: "ARBITRUM_ONE",
    };
    delete process.env.SUBGRAPH_API_KEY;
    delete process.env.SUBGRAPH_ENDPOINT;
    delete process.env.NEXT_PUBLIC_SUBGRAPH_ID;
    delete process.env.NEXT_PUBLIC_SUBGRAPH_API_KEY;
    delete process.env.NEXT_PUBLIC_SUBGRAPH_ENDPOINT;
    Reflect.deleteProperty(globalThis, "window");
  });

  afterEach(() => {
    process.env = originalEnv;
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  const loadChains = async () => {
    let chains!: typeof import("./chains");
    await jest.isolateModulesAsync(async () => {
      chains = await import("./chains");
    });
    return chains;
  };

  const expectSubgraph = async (expected: string) => {
    const { CHAIN_INFO } = await loadChains();
    expect(Object.values(CHAIN_INFO).map((chain) => chain.subgraph)).toEqual([
      expected,
      expected,
    ]);
  };

  it.each([false, true])(
    "browser imports expose the proxy URL with private configuration present: %s",
    async (configured) => {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: {},
      });
      if (configured) {
        process.env.SUBGRAPH_API_KEY = "private-browser-test-key";
        process.env.SUBGRAPH_ENDPOINT =
          "https://private-browser.example/subgraph";
        process.env.NEXT_PUBLIC_SUBGRAPH_ID = "public-test-id";
      }

      await expectSubgraph("/api/graphql");
    }
  );

  it("does not read private subgraph configuration in the browser", async () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });
    for (const name of ["SUBGRAPH_API_KEY", "SUBGRAPH_ENDPOINT"]) {
      Object.defineProperty(process.env, name, {
        configurable: true,
        get: () => {
          throw new Error(`Browser read private environment variable ${name}`);
        },
      });
    }

    await expectSubgraph("/api/graphql");
  });

  it("builds the server gateway URL from the private key and public ID", async () => {
    process.env.SUBGRAPH_API_KEY = "private-server-test-key";
    process.env.NEXT_PUBLIC_SUBGRAPH_ID = "public-test-id";

    await expectSubgraph(
      "https://gateway.thegraph.com/api/private-server-test-key/subgraphs/id/public-test-id"
    );
  });

  it("uses the default subgraph ID when none is configured", async () => {
    process.env.SUBGRAPH_API_KEY = "private-server-test-key";

    await expectSubgraph(
      "https://gateway.thegraph.com/api/private-server-test-key/subgraphs/id/FE63YgkzcpVocxdCEyEYbvjYqEf2kb1A6daMYRxmejYC"
    );
  });

  it.each([undefined, "private-server-test-key"])(
    "prefers the server endpoint override with key %s",
    async (key) => {
      process.env.SUBGRAPH_ENDPOINT = "https://override.example/subgraph";
      if (key) {
        process.env.SUBGRAPH_API_KEY = key;
      }

      await expectSubgraph("https://override.example/subgraph");
    }
  );

  it("fails clearly when server subgraph configuration is missing", async () => {
    await expect(loadChains()).rejects.toThrow(missingConfigMessage);
  });

  it.each(["NEXT_PUBLIC_SUBGRAPH_API_KEY", "NEXT_PUBLIC_SUBGRAPH_ENDPOINT"])(
    "does not fall back to legacy %s on the server",
    async (name) => {
      process.env[name] = "legacy-private-value";

      await expect(loadChains()).rejects.toThrow(
        new Error(missingConfigMessage)
      );
    }
  );
});
