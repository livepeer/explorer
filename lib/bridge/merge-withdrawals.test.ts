import { mergeWithdrawals, type SentWithdrawal } from "./progress";
import type { BridgeWithdrawal } from "./types";

const sent: SentWithdrawal = {
  tx: "0xAB",
  from: "0xa",
  to: "0xa",
  amount: "1",
  timestamp: 1_000,
};
const indexed = (tx: string): BridgeWithdrawal => ({
  id: "7",
  from: "0xa",
  to: "0xa",
  amount: "1",
  block: "1",
  timestamp: 1_000,
  tx,
  status: "waiting",
  readyAt: 9_000,
});

describe("mergeWithdrawals", () => {
  it("shows a just-sent withdrawal before the index has it", () => {
    const [w] = mergeWithdrawals([], [sent], 1_060);
    expect(w).toMatchObject({
      tx: "0xAB",
      status: "waiting",
      readyAt: 1_000 + 7 * 86_400,
    });
  });

  it("lets the index speak once it has it (any letter case)", () => {
    const out = mergeWithdrawals([indexed("0xab")], [sent], 1_060);
    expect(out.map((w) => w.id)).toEqual(["7"]);
  });

  it("forgets a local copy the index never showed after a day", () => {
    expect(mergeWithdrawals([], [sent], 1_000 + 86_401)).toEqual([]);
  });
});
