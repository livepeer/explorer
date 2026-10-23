import { paginate, querySubgraph } from "./client";
import { newestTickets } from "./gateways";

jest.mock("./client", () => ({
  querySubgraph: jest.fn(),
  paginate: jest.fn(),
}));

type Ticket = {
  id: string;
  timestamp: number;
  faceValue: string;
  recipient: { id: string } | null;
};

/** `n` tickets at timestamp `ts`, ids `<ts>-<i>`. */
const batch = (ts: number, n: number): Ticket[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `${ts}-${String(i).padStart(4, "0")}`,
    timestamp: ts,
    faceValue: "1",
    recipient: { id: "0xo" },
  }));

/** Serve `all` (newest first) the way the subgraph would. */
function serve(all: Ticket[]) {
  jest
    .mocked(querySubgraph)
    .mockImplementation(async (_q, vars: Record<string, unknown> = {}) => {
      const page = all
        .filter((t) => t.timestamp < (vars.before as number))
        .slice(0, vars.first as number);
      return { winningTicketRedeemedEvents: page } as never;
    });
  jest
    .mocked(paginate)
    .mockImplementation(
      async (_q, _key, vars: Record<string, unknown> = {}) =>
        all
          .filter((t) => t.timestamp === vars.at)
          .sort((a, b) => a.id.localeCompare(b.id)) as never
    );
}

describe("newestTickets", () => {
  afterEach(() => jest.resetAllMocks());

  it("keeps the most recent tickets, reading a batch across a page edge whole", async () => {
    // 900 recent tickets, then a batch of 300 sharing one timestamp that a
    // 1,000-row page cuts in two, then older ones.
    serve([...batch(300, 900), ...batch(200, 300), ...batch(100, 500)]);
    const { rows, truncated } = await newestTickets("0xgw", 0, 1_200);
    expect(rows).toHaveLength(1_200);
    expect(new Set(rows.map((r) => r.id)).size).toBe(1_200);
    // Every ticket of the newest 1,200, none of the older ones.
    expect(rows.every((r) => r.timestamp >= 200)).toBe(true);
    expect(truncated).toBe(true);
  });

  it("isn't truncated when exactly the cap exists", async () => {
    serve(batch(300, 50));
    const { rows, truncated } = await newestTickets("0xgw", 0, 50);
    expect(rows).toHaveLength(50);
    expect(truncated).toBe(false);
  });
});
