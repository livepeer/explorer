/**
 * @jest-environment jsdom
 */
import { read, write } from "./view-scope";

describe("view scope", () => {
  it("follows the last choice when storage can be read but not written", () => {
    // Storage that still answers with an old view but refuses writes, as a
    // full quota does.
    jest
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue("0x00000000000000000000000000000000000000aa");
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    write("0x00000000000000000000000000000000000000bb");
    expect(read()).toBe("0x00000000000000000000000000000000000000bb");
    write("all");
    expect(read()).toBe("all");
  });
});
