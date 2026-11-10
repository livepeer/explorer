import { sameTransaction, txOutcome } from "./outcome";

describe("txOutcome", () => {
  const none = new Set<string>();

  it("is unknown until there's a transaction and a receipt", () => {
    expect(txOutcome(undefined, none, undefined)).toBeUndefined();
    expect(txOutcome("0xa", none, undefined)).toBeUndefined();
  });

  it("follows the receipt", () => {
    expect(txOutcome("0xa", none, { status: "success" })).toBe("success");
    expect(txOutcome("0xa", none, { status: "reverted" })).toBe("reverted");
  });

  it("is abandoned when the wallet replaced it, even by a success", () => {
    // A cancellation is a successful transaction too.
    const gone = new Set(["0xab"]);
    expect(txOutcome("0xAB", gone, { status: "success" })).toBe("abandoned");
    expect(txOutcome("0xAB", gone, undefined)).toBe("abandoned");
  });

  it("only abandons the transaction that was replaced", () => {
    expect(txOutcome("0xb", new Set(["0xa"]), { status: "success" })).toBe(
      "success"
    );
  });
});

describe("sameTransaction", () => {
  it("counts a fee bump as the same transaction, nothing else", () => {
    expect(sameTransaction("repriced")).toBe(true);
    expect(sameTransaction("cancelled")).toBe(false);
    expect(sameTransaction("replaced")).toBe(false);
  });
});
