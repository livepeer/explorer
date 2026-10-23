import { searchRank } from "./search";

describe("searchRank", () => {
  const addr = "0xb29178bd5e0da702ab69129048af7b9fcf222026";

  it("ranks a name prefix above a match elsewhere", () => {
    expect(searchRank(addr, "titan-node.eth", "titan")).toBe(0);
    expect(searchRank(addr, "the-titan.eth", "titan")).toBe(1);
  });

  it("still matches by address, with or without a name", () => {
    expect(searchRank(addr, "titan-node.eth", "0xb291")).toBe(1);
    expect(searchRank(addr, undefined, "9048af")).toBe(1);
  });

  it("drops what matches neither", () => {
    expect(searchRank(addr, "titan-node.eth", "vires")).toBeNull();
    expect(searchRank(addr, undefined, "titan")).toBeNull();
  });

  it("keeps everything for an empty query", () => {
    expect(searchRank(addr, undefined, "")).toBe(1);
  });
});
