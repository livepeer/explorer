import { landedSince } from "./progress";
import type { TrackedDeposit } from "./types";

const base = { from: "0xa", to: "0xa", amount: "1", sentAt: 1_000 };
const dep = (
  seq: string,
  status: TrackedDeposit["status"],
  l1Tx: `0x${string}` = "0xbatch"
): TrackedDeposit => ({ ...base, l1Tx, seq, status });

describe("landedSince", () => {
  it("reports a deposit seen on its way once it arrives, and only once", () => {
    const watching = new Set<string>();
    expect(landedSince(watching, [dep("1", "processing")])).toEqual([]);
    expect(landedSince(watching, [dep("1", "arrived")])).toEqual([
      dep("1", "arrived"),
    ]);
    expect(landedSince(watching, [dep("1", "arrived")])).toEqual([]);
  });

  it("doesn't report one first seen already arrived", () => {
    expect(landedSince(new Set(), [dep("1", "arrived")])).toEqual([]);
  });

  it("tells apart deposits batched in one transaction", () => {
    const watching = new Set<string>();
    landedSince(watching, [dep("1", "processing"), dep("2", "processing")]);
    // One of the two lands: the other is still watched.
    expect(
      landedSince(watching, [dep("1", "processing"), dep("2", "arrived")])
    ).toEqual([dep("2", "arrived")]);
    expect(
      landedSince(watching, [dep("1", "arrived"), dep("2", "arrived")])
    ).toEqual([dep("1", "arrived")]);
  });

  it("counts a transaction sent from here for every deposit in it", () => {
    // Sent here, first reported with both already arrived.
    const watching = new Set(["0xbatch"]);
    expect(
      landedSince(watching, [dep("1", "arrived"), dep("2", "arrived")])
    ).toEqual([dep("1", "arrived"), dep("2", "arrived")]);
    expect(watching.size).toBe(0);
  });
});
