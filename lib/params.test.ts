import { routeParam } from "./params";

describe("routeParam", () => {
  it("decodes a segment", () => {
    expect(routeParam("vitalik%2Eeth")).toBe("vitalik.eth");
  });

  it("returns a malformed segment as is instead of throwing", () => {
    expect(routeParam("%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("handles a missing segment", () => {
    expect(routeParam(undefined)).toBe("");
  });
});
