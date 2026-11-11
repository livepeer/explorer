import { agreedAddress } from "./address-input";

const A = "0x00000000000000000000000000000000000000Aa";
const B = "0x00000000000000000000000000000000000000bB";

const ok = (value: `0x${string}` | null) =>
  ({ status: "fulfilled", value } as const);
const failed = { status: "rejected", reason: new Error("down") } as const;

describe("agreedAddress", () => {
  it("accepts an address two RPCs agree on", () => {
    expect(
      agreedAddress([ok(A), ok(A.toLowerCase() as `0x${string}`)])
    ).toEqual({ address: A.toLowerCase(), disagree: false });
  });

  it("refuses a name the RPCs disagree on", () => {
    expect(agreedAddress([ok(A), ok(B)])).toEqual({
      address: null,
      disagree: true,
    });
  });

  it("refuses to trust a single answer", () => {
    expect(agreedAddress([ok(A), failed])).toEqual({
      address: null,
      disagree: false,
    });
  });

  it("treats one RPC saying the name is unset as a disagreement", () => {
    expect(agreedAddress([ok(A), ok(null)])).toEqual({
      address: null,
      disagree: true,
    });
  });
});
