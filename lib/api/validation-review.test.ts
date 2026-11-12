/** @jest-environment node */

import { getEnsForAddress } from "@lib/api/ens";
import { RegionsSchema } from "@lib/api/schemas";
import { l1PublicClient } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";

import pipelinesHandler from "../../pages/api/pipelines";
import allScoresHandler from "../../pages/api/score";
import scoreHandler from "../../pages/api/score/[address]";
import proposalStateHandler from "../../pages/api/treasury/proposal/[proposalId]/state";
import uploadIpfsHandler from "../../pages/api/upload-ipfs";

jest.mock("@lib/api", () => jest.requireActual("@lib/api/api"));
jest.mock("@lib/chains", () => ({
  CHAIN_INFO: { 42161: { pricingUrl: "https://pricing.example" } },
  DEFAULT_CHAIN_ID: 42161,
  NETWORK_RPC_URLS: { 42161: ["https://rpc.example"] },
  l1PublicClient: { getEnsName: jest.fn(), getEnsText: jest.fn() },
}));
jest.mock("@lib/fetchWithRetry");

const address = "0x1111111111111111111111111111111111111111";
const otherAddress = "0x2222222222222222222222222222222222222222";
const score = {
  value: 0.9,
  region: "FRA",
  model: "model",
  pipeline: "pipeline",
  orchestrator: address,
};
const prices = [{ Address: address, PricePerPixel: 12 }];
let metrics: Record<string, unknown>;
const fetchMock = jest.mocked(fetchWithRetry);
const request = (query: NextApiRequest["query"]) =>
  ({ method: "GET", query } as NextApiRequest);
const response = () => {
  const res = {
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res as typeof res & NextApiResponse;
};

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Enforce output contracts in these handler regressions as well.
  jest.replaceProperty(process, "env", {
    ...process.env,
    NODE_ENV: "development",
    NEXT_PUBLIC_AI_METRICS_SERVER_URL: "https://ai.example",
    NEXT_PUBLIC_METRICS_SERVER_URL: "https://metrics.example",
    PINATA_JWT: "TEST_PINATA_JWT",
  });
  metrics = {};
  fetchMock.mockImplementation(async (url) => {
    const requestUrl = String(url);
    const body = requestUrl.includes("/api/aggregated_stats")
      ? metrics
      : requestUrl.includes("/api/top_ai_score")
      ? score
      : requestUrl.includes("/api/pipelines")
      ? { pipelines: [] }
      : prices;
    return new Response(JSON.stringify(body));
  });
  jest.mocked(l1PublicClient.getEnsName).mockResolvedValue("alice.eth");
});
afterEach(() => jest.restoreAllMocks());

describe("ENS website records", () => {
  it.each([
    ["example.com/path", "https://example.com/path"],
    ["//example.com/path", "https://example.com/path"],
    ["https://example.com/path", "https://example.com/path"],
    ["http://example.com/path", "http://example.com/path"],
    ["javascript:alert(1)", null],
    ["/relative/path", null],
    [null, null],
  ])(
    "normalizes or rejects %p without losing the identity",
    async (raw, url) => {
      (l1PublicClient.getEnsText as jest.Mock).mockImplementation(({ key }) =>
        Promise.resolve(key === "url" ? raw : null)
      );
      expect(await getEnsForAddress(address)).toEqual(
        expect.objectContaining({ name: "alice.eth", url })
      );
    }
  );
});

describe("empty regional metrics", () => {
  it("returns zero averages alongside healthy orchestrators in the batch", async () => {
    metrics = {
      [address]: {},
      [otherAddress]: {
        FRA: { success_rate: 0.8, round_trip_score: 0.6, score: 0.7 },
      },
    };
    const res = response();
    await allScoresHandler(request({}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      [address]: {
        pricePerPixel: 12,
        successRates: { FRA: 0, GLOBAL: 0 },
        roundTripScores: { FRA: 0, GLOBAL: 0 },
        scores: { FRA: 0, GLOBAL: 0 },
      },
      [otherAddress]: {
        pricePerPixel: 0,
        successRates: { FRA: 80, GLOBAL: 80 },
        roundTripScores: { FRA: 60, GLOBAL: 60 },
        scores: { FRA: 70, GLOBAL: 70 },
      },
    });
  });

  it("matches prices to checksummed metrics addresses", async () => {
    const checksummed = "0x52908400098527886E0F7030069857D2E4169EE7";
    metrics = {
      [checksummed]: {
        FRA: { success_rate: 0.8, round_trip_score: 0.6, score: 0.7 },
      },
    };
    fetchMock.mockImplementation(async (url) =>
      String(url).includes("/api/aggregated_stats")
        ? new Response(JSON.stringify(metrics))
        : new Response(
            JSON.stringify([
              { Address: checksummed.toLowerCase(), PricePerPixel: 7 },
            ])
          )
    );
    const res = response();
    await allScoresHandler(request({}), res);
    expect(res.json).toHaveBeenCalledWith({
      [checksummed]: expect.objectContaining({ pricePerPixel: 7 }),
    });
  });

  it("retains price and AI score when an orchestrator has no regional metrics", async () => {
    metrics = { [address]: {} };
    const res = response();
    await scoreHandler(request({ address }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      pricePerPixel: 12,
      topAIScore: score,
      successRates: { GLOBAL: 0 },
      roundTripScores: { GLOBAL: 0 },
      scores: { GLOBAL: 0 },
    });
  });
});

describe("upstream query parameters", () => {
  it.each(["NYC", "NYC&model=other", "NYC#suffix", "region+variant"])(
    "forwards region %p as one complete value",
    async (region) => {
      const res = response();
      await pipelinesHandler(request({ region }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      const url = new URL(String(fetchMock.mock.calls[0][0]));
      expect(url.origin).toBe("https://ai.example");
      expect([...url.searchParams]).toEqual([["region", region]]);
      expect(url.hash).toBe("");
    }
  );

  it("forwards pipeline and model values without adding query syntax", async () => {
    const pipeline = "foo&model=bar#fragment";
    const model = "org/model+variant&extra=value";
    const res = response();
    await allScoresHandler(request({ pipeline, model }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.origin).toBe("https://ai.example");
    expect([...url.searchParams]).toEqual([
      ["pipeline", pipeline],
      ["model", model],
    ]);
    expect(url.hash).toBe("");
  });

  it.each([
    [{}, "https://metrics.example/api/aggregated_stats"],
    [
      { pipeline: "llm" },
      "https://ai.example/api/aggregated_stats?pipeline=llm",
    ],
  ])("keeps the upstream selection for %p", async (query, expectedUrl) => {
    const res = response();
    await allScoresHandler(request(query), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(fetchMock.mock.calls[0][0]).toBe(expectedUrl);
  });
});

describe("IPFS proposal commit hashes", () => {
  it.each(["g".repeat(40), "a".repeat(39), "a".repeat(41)])(
    "rejects malformed hash %p before contacting Pinata",
    async (gitCommitHash) => {
      const pinataFetch = jest
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(new Error("Unexpected Pinata request"));
      const res = response();
      await uploadIpfsHandler(
        {
          method: "POST",
          body: { gitCommitHash, text: "proposal" },
        } as NextApiRequest,
        res
      );
      expect(res.status).toHaveBeenCalledWith(400);
      expect(pinataFetch).not.toHaveBeenCalled();
    }
  );

  it.each(["abcdef0123".repeat(4), "ABCDEF0123".repeat(4)])(
    "pins a proposal with a valid hexadecimal hash %p",
    async (gitCommitHash) => {
      const pinataFetch = jest
        .spyOn(globalThis, "fetch")
        .mockResolvedValue(new Response(JSON.stringify({ IpfsHash: "cid" })));
      const body = { gitCommitHash, text: "proposal" };
      const res = response();
      await uploadIpfsHandler({ method: "POST", body } as NextApiRequest, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ hash: "cid" });
      expect(pinataFetch).toHaveBeenCalledWith(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        expect.objectContaining({ body: JSON.stringify(body) })
      );
    }
  );
});

describe("treasury proposal IDs", () => {
  it.each(["abc", "-1", (2n ** 256n).toString()])(
    "rejects %p before any contract call",
    async (proposalId) => {
      const res = response();
      await proposalStateHandler(request({ proposalId }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    }
  );
});

describe("IPFS proposal text", () => {
  it("limits the proposal text by UTF-8 bytes, not characters", async () => {
    const pinataFetch = jest
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Unexpected Pinata request"));
    const res = response();
    await uploadIpfsHandler(
      {
        method: "POST",
        // 200,000 emoji are 400,000 UTF-16 code units but 800,000 bytes.
        body: { gitCommitHash: "a".repeat(40), text: "😀".repeat(200_000) },
      } as NextApiRequest,
      res
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(pinataFetch).not.toHaveBeenCalled();
  });
});

describe("metrics server regions", () => {
  it("drops invalid regions without discarding valid ones", () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const valid = { id: "FRA", name: "Frankfurt", type: "transcoding" };
    const result = RegionsSchema.safeParse({
      regions: [valid, { id: "NYC", name: "New York", type: "invalid" }, null],
    });
    expect(result.success && result.data.regions).toEqual([valid]);
    expect(console.warn).toHaveBeenCalledTimes(2);
  });
});
