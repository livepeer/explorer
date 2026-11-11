import { localList } from "./local-list";

/** Storage that holds what's written, or refuses every write. */
function stubStorage(writable: boolean) {
  const data = new Map<string, string>();
  Object.assign(globalThis, {
    localStorage: {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (!writable) throw new Error("QuotaExceededError");
        data.set(k, v);
      },
    },
    window: { addEventListener() {}, removeEventListener() {} },
  });
}

describe("localList", () => {
  it("keeps what's written in storage", () => {
    stubStorage(true);
    const list = localList<number>("k");
    list.write([1, 2]);
    expect(list.read()).toEqual([1, 2]);
    expect(localList<number>("k").read()).toEqual([1, 2]);
  });

  it("keeps it in memory, and tells listeners, when storage refuses it", () => {
    stubStorage(false);
    const list = localList<number>("k");
    const heard = jest.fn();
    list.subscribe(heard);
    list.write([3]);
    expect(heard).toHaveBeenCalled();
    // Just sent: still there, though it won't survive a reload.
    expect(list.read()).toEqual([3]);
    list.write([...list.read(), 4]);
    expect(list.read()).toEqual([3, 4]);
  });
});
