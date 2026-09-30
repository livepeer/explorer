import { paginate, SubgraphError } from "./client";

/** A collection of `total` rows, served 1,000 at a time by id. */
function mockRows(total: number) {
  global.fetch = jest.fn(async (_url: unknown, init?: { body?: string }) => {
    const { variables } = JSON.parse(init?.body ?? "{}");
    const after = variables.lastId ? Number(variables.lastId) : -1;
    const count = Math.max(0, Math.min(variables.first, total - after - 1));
    const rows = Array.from({ length: count }, (_, i) => ({
      id: String(after + 1 + i),
    }));
    return { ok: true, json: async () => ({ data: { items: rows } }) };
  }) as unknown as typeof fetch;
}

describe("paginate", () => {
  it("reads every page", async () => {
    mockRows(2500);
    await expect(paginate("q", "items")).resolves.toHaveLength(2500);
  });

  it("throws at the cap rather than return a partial list", async () => {
    mockRows(3500);
    await expect(paginate("q", "items", {}, { max: 2000 })).rejects.toThrow(
      SubgraphError
    );
  });

  it("returns what it has at the cap when partial results are fine", async () => {
    mockRows(3500);
    await expect(
      paginate("q", "items", {}, { max: 2000, partial: true })
    ).resolves.toHaveLength(2000);
  });
});
