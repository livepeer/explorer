import { encodeFunctionData } from "viem";

import { bondingManager } from "@/lib/abis/BondingManager";

import { fetchSafeProposals } from "./queue";

const GATEWAY = "https://safe-client.safe.global/v1/chains/42161";
const SAFE = "0x1111111111111111111111111111111111111111";
const BM = "0x35bcf3c30594191d53231e4ff333e8a770453e40";
const ORCH = "0xb29178bd5e0da702ab69129048af7b9fcf222026";
const ZERO = "0x0000000000000000000000000000000000000000";

const bond = encodeFunctionData({
  abi: bondingManager,
  functionName: "bondWithHint",
  args: [5n, ORCH, ZERO, ZERO, ZERO, ZERO],
});

const tx = (id: string, type: string, isCancellation = false) => ({
  type: "TRANSACTION",
  transaction: {
    id,
    txInfo: { type, isCancellation },
    executionInfo: {
      nonce: 1,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    },
  },
});

const json = (body: unknown) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve(body) });

describe("fetchSafeProposals", () => {
  afterEach(() => jest.restoreAllMocks());

  it("reads the whole queue, opening only contract calls", async () => {
    const queued = `${GATEWAY}/safes/${SAFE}/transactions/queued`;
    const next = `${queued}?cursor=2`;
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockImplementation((input) => {
        const url = String(input);
        if (url === queued)
          return json({
            next,
            results: [
              tx("transfer", "Transfer"),
              tx("rejection", "Custom", true),
              tx("settings", "SettingsChange"),
            ],
          }) as never;
        if (url === next)
          return json({ next: null, results: [tx("bond", "Custom")] }) as never;
        if (url === `${GATEWAY}/transactions/bond`)
          return json({
            txData: { to: { value: BM }, hexData: bond, operation: 0 },
          }) as never;
        throw new Error(`unexpected fetch ${url}`);
      });

    const proposals = await fetchSafeProposals(SAFE, {
      bondingManager: BM,
      token: ZERO,
    });

    // A Livepeer action past the first page is still found.
    expect(proposals.map((p) => p.id)).toEqual(["bond"]);
    // Transfers, settings changes and rejections are never opened.
    const opened = fetchMock.mock.calls
      .map(([u]) => String(u))
      .filter((u) => u.includes("/transactions/") && !u.includes("queued"));
    expect(opened).toEqual([`${GATEWAY}/transactions/bond`]);
  });

  it("doesn't follow a next link off the gateway", async () => {
    const fetchMock = jest.spyOn(global, "fetch").mockImplementation(
      () =>
        json({
          next: "https://example.com/queued",
          results: [],
        }) as never
    );
    await fetchSafeProposals(SAFE, { bondingManager: BM, token: ZERO });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
