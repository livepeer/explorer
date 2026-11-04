import { mergeDeposits } from "./progress";
import type { TrackedDeposit } from "./types";

const base = { from: "0xa", to: "0xa", amount: "1", sentAt: 1_000 };
const tracked = (
  l1Tx: `0x${string}`,
  status: TrackedDeposit["status"]
): TrackedDeposit => ({ ...base, l1Tx, status });

describe("mergeDeposits", () => {
  it("adds just-sent deposits the chain hasn't shown yet", () => {
    const out = mergeDeposits([], [{ ...base, l1Tx: "0x1" }], 1_100);
    expect(out).toEqual([{ ...base, l1Tx: "0x1", status: "processing" }]);
  });

  it("lets the chain speak once it shows a deposit, and drops arrivals", () => {
    const out = mergeDeposits(
      [tracked("0x1", "arrived"), tracked("0x2", "retry")],
      [{ ...base, l1Tx: "0x1" }],
      1_100
    );
    expect(out.map((d) => [d.l1Tx, d.status])).toEqual([["0x2", "retry"]]);
  });

  it("forgets a local copy the chain never showed after a day", () => {
    expect(
      mergeDeposits([], [{ ...base, l1Tx: "0x1" }], 1_000 + 25 * 3600)
    ).toEqual([]);
  });
});
