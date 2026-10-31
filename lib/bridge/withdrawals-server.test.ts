import snapshot from "@/data/bridge-withdrawals.json";

import { classify } from "./withdrawals-server";

const w = (id: string, timestamp: number) => ({
  id,
  from: "0xa",
  to: "0xa",
  amount: "1000000000000000000",
  block: "1",
  timestamp,
  tx: "0x1",
});

describe("classify", () => {
  const now = 1_000_000;
  // Ethereum has confirmed Arbitrum through message 100, made 6.5 days ago.
  const confirmed = { sendCount: 100n, timestamp: now - 561_600 };

  it("is ready once confirmed past its message number", () => {
    const [r] = classify([w("99", now - 900_000)], confirmed, now);
    expect(r.status).toBe("ready");
    expect(r.readyAt).toBeNull();
  });

  it("estimates when a newer one will be", () => {
    const [r] = classify([w("100", now - 86_400)], confirmed, now);
    expect(r.status).toBe("waiting");
    // Made a day ago, confirmations 6.5 days behind: 5.5 days to go.
    expect(r.readyAt).toBe(now - 86_400 + 561_600);
  });
});

describe("snapshot", () => {
  it("holds only Nitro-era withdrawals, lowercased, with amounts", () => {
    expect(snapshot.withdrawals.length).toBeGreaterThan(0);
    for (const x of snapshot.withdrawals) {
      expect(BigInt(x.block)).toBeGreaterThanOrEqual(22_207_817n);
      expect(x.to).toBe(x.to.toLowerCase());
      expect(x.from).toBe(x.from.toLowerCase());
      expect(BigInt(x.amount)).toBeGreaterThan(0n);
      expect(BigInt(x.block)).toBeLessThanOrEqual(BigInt(snapshot.toBlock));
    }
  });
});
