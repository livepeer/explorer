/** @jest-environment node */

import { getCacheControlHeader } from "@lib/api/api";
import {
  getBondingManagerAddress,
  getContractAddress,
  getRoundsManagerAddress,
} from "@lib/api/contracts";
import { getEnsForAddress } from "@lib/api/ens";
import { PerformanceMetricsSchema } from "@lib/api/schemas/performance";
import { l1PublicClient, l2PublicClient } from "@lib/chains";
import { fetchWithRetry } from "@lib/fetchWithRetry";
import { NextApiRequest, NextApiResponse } from "next";

import currentRoundHandler from "../../pages/api/current-round";
import pendingStakeHandler from "../../pages/api/pending-stake/[address]";
import scoreHandler from "../../pages/api/score/[address]";

jest.mock("@lib/api", () => jest.requireActual("@lib/api/api"));
jest.mock("@lib/api/contracts", () => ({
  getBondingManagerAddress: jest.fn(),
  getContractAddress: jest.fn(),
  getRoundsManagerAddress: jest.fn(),
}));
jest.mock("@lib/chains", () => ({
  CHAIN_INFO: { 42161: { pricingUrl: "https://pricing.example" } },
  DEFAULT_CHAIN_ID: 42161,
  l1PublicClient: { getEnsName: jest.fn(), getEnsText: jest.fn() },
  l2PublicClient: {
    readContract: jest.fn(),
    getBlockNumber: jest.fn(),
    multicall: jest.fn(),
  },
}));
jest.mock("@lib/fetchWithRetry");
// Aggregation is independent of the upstream validation exercised here.
jest.mock("@lib/utils", () => ({ avg: () => 0.5 }));

const address = "0x1111111111111111111111111111111111111111";
const roundsManagerAddress = "0x2222222222222222222222222222222222222222";
const bondingManagerAddress = "0x3333333333333333333333333333333333333333";
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
const fetchMock = jest.mocked(fetchWithRetry);
const readContractMock = l2PublicClient.readContract as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.mocked(getContractAddress).mockResolvedValue(roundsManagerAddress);
  jest.mocked(getRoundsManagerAddress).mockResolvedValue(roundsManagerAddress);
  jest
    .mocked(getBondingManagerAddress)
    .mockResolvedValue(bondingManagerAddress);
});
afterEach(() => jest.restoreAllMocks());

it("validates ENS text records while retaining the local avatar proxy", async () => {
  jest.mocked(l1PublicClient.getEnsName).mockResolvedValue("alice.eth");
  const records = {
    description: "Hello\n<script>alert(1)</script>",
    url: "javascript:alert(1)",
    "com.twitter": "invalid handle!",
    "com.github": "invalid handle!",
    avatar: "ipfs://avatar-cid",
  };
  (l1PublicClient.getEnsText as jest.Mock).mockImplementation(({ key }) =>
    Promise.resolve(records[key])
  );

  const identity = await getEnsForAddress(address);

  expect(identity).toEqual(
    expect.objectContaining({
      name: "alice.eth",
      avatar: "/api/ens-data/image/alice.eth",
      url: null,
      twitter: null,
      github: null,
    })
  );
  expect(identity.description).toContain("Hello<br");
  expect(identity.description).not.toContain("script");
});

it("returns a validated current round entirely from RPC reads", async () => {
  const values = {
    currentRound: 42n,
    currentRoundStartBlock: 100n,
    currentRoundInitialized: true,
    currentRoundLocked: false,
    roundLength: 10n,
    blockNum: 105n,
  };
  readContractMock.mockImplementation(({ functionName }) =>
    Promise.resolve(values[functionName])
  );
  jest.mocked(l2PublicClient.getBlockNumber).mockResolvedValue(200n);
  const res = response();

  await currentRoundHandler(request({}), res);

  expect(getContractAddress).toHaveBeenCalledWith("RoundsManager");
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({
    id: 42,
    startBlock: 100,
    initialized: true,
    locked: false,
    roundLength: 10,
    currentL1Block: 105,
    currentL2Block: 200,
  });
});

it("uses the RPC current round for validated pending stake requests", async () => {
  readContractMock.mockResolvedValue(42n);
  (l2PublicClient.multicall as jest.Mock).mockResolvedValue([123n, 456n]);
  const res = response();

  await pendingStakeHandler(request({ address }), res);

  expect(readContractMock).toHaveBeenCalledWith(
    expect.objectContaining({
      address: roundsManagerAddress,
      functionName: "currentRound",
    })
  );
  expect(l2PublicClient.multicall).toHaveBeenCalledWith(
    expect.objectContaining({
      allowFailure: false,
      contracts: [
        expect.objectContaining({
          functionName: "pendingStake",
          args: [address, 42n],
        }),
        expect.objectContaining({
          functionName: "pendingFees",
          args: [address, 42n],
        }),
      ],
    })
  );
  expect(res.status).toHaveBeenCalledWith(200);
  expect(res.json).toHaveBeenCalledWith({
    pendingStake: "123",
    pendingFees: "456",
  });
});

it("rejects an invalid pending stake address before any RPC call", async () => {
  const res = response();
  await pendingStakeHandler(request({ address: [address] }), res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(getBondingManagerAddress).not.toHaveBeenCalled();
  expect(readContractMock).not.toHaveBeenCalled();
});

describe("validated performance metrics", () => {
  const score = {
    value: 0.9,
    region: "FRA",
    model: "model",
    pipeline: "pipeline",
    orchestrator: address,
  };
  const metrics = {
    [address]: {
      FRA: { success_rate: 0.5, round_trip_score: 0.5, score: 0.5 },
    },
  };
  const prices = [{ Address: address, PricePerPixel: 12 }];

  const upstreams = (ai: unknown, video: unknown, pricing: unknown) => {
    [ai, video, pricing].forEach((body) => {
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify(body), {
          headers: { "content-type": "application/json" },
        })
      );
    });
  };

  it("returns fully validated results when every upstream is healthy", async () => {
    upstreams(score, metrics, prices);
    const res = response();
    await scoreHandler(request({ address }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(PerformanceMetricsSchema.safeParse(result).success).toBe(true);
    expect(result).toEqual(
      expect.objectContaining({ topAIScore: score, pricePerPixel: 12 })
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      "Cache-Control",
      expect.stringContaining("stale-while-revalidate=7200")
    );
  });

  it.each(["ai", "video", "pricing"])(
    "keeps healthy results and shortens caching when %s data is malformed",
    async (failedService) => {
      upstreams(
        failedService === "ai" ? { value: "invalid" } : score,
        failedService === "video" ? { [address]: "invalid" } : metrics,
        failedService === "pricing" ? [{ PricePerPixel: "invalid" }] : prices
      );
      const res = response();
      await scoreHandler(request({ address }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      const result = res.json.mock.calls[0][0];
      expect(PerformanceMetricsSchema.safeParse(result).success).toBe(true);
      expect(result.topAIScore).toEqual(failedService === "ai" ? null : score);
      expect(result.pricePerPixel).toBe(
        failedService === "pricing" ? null : 12
      );
      for (const key of ["successRates", "roundTripScores", "scores"]) {
        if (failedService === "video") {
          expect(result[key]).toBeNull();
        } else {
          expect(result[key]).toEqual({ FRA: 50, GLOBAL: 50 });
        }
      }
      expect(res.setHeader).toHaveBeenCalledWith(
        "Cache-Control",
        getCacheControlHeader("minute")
      );
    }
  );

  it("keeps other metrics when one upstream request rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("upstream unavailable"));
    [metrics, prices].forEach((body) =>
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(body)))
    );
    const res = response();
    await scoreHandler(request({ address }), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ topAIScore: null, pricePerPixel: 12 })
    );
  });

  it("returns 502 when no upstream provides valid data", async () => {
    upstreams("invalid", "invalid", "invalid");
    const res = response();
    await scoreHandler(request({ address }), res);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "EXTERNAL_API_ERROR" })
    );
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it("rejects invalid addresses before fetching upstream data", async () => {
    const res = response();
    await scoreHandler(request({ address: "invalid" }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
