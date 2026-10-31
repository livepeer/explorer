import { isCid, memoize, rateLimiter, readCapped } from "./memo";

describe("memoize", () => {
  it("shares one call between concurrent and repeat requests", async () => {
    const fn = jest.fn(async (k: string) => k.toUpperCase());
    const get = memoize(fn, { ttlMs: 60_000 });
    const [a, b] = await Promise.all([get("x"), get("x")]);
    await get("x");
    expect([a, b]).toEqual(["X", "X"]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("doesn't keep failures", async () => {
    let calls = 0;
    const get = memoize(
      async () => {
        calls++;
        if (calls === 1) throw new Error("down");
        return "ok";
      },
      { ttlMs: 60_000 }
    );
    await expect(get("x")).rejects.toThrow("down");
    await expect(get("x")).resolves.toBe("ok");
  });

  it("holds at most max keys", async () => {
    const fn = jest.fn(async (k: string) => k);
    const get = memoize(fn, { ttlMs: 60_000, max: 2 });
    await get("a");
    await get("b");
    await get("c");
    await get("a");
    expect(fn).toHaveBeenCalledTimes(4);
  });
});

describe("readCapped", () => {
  it("reads a body within the limit", async () => {
    await expect(readCapped(new Response("hello"), 10)).resolves.toBe("hello");
  });

  it("refuses a body past the limit", async () => {
    await expect(readCapped(new Response("x".repeat(11)), 10)).rejects.toThrow(
      "too large"
    );
  });
});

describe("isCid", () => {
  it("accepts IPFS hashes and nothing else", () => {
    expect(isCid("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG")).toBe(true);
    expect(isCid("../../etc/passwd")).toBe(false);
    expect(isCid("")).toBe(false);
  });
});

describe("rateLimiter", () => {
  it("allows up to the limit per key and window", () => {
    const allow = rateLimiter({ limit: 2, windowMs: 60_000 });
    expect([allow("a"), allow("a"), allow("a"), allow("b")]).toEqual([
      true,
      true,
      false,
      true,
    ]);
  });
});
