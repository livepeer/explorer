import type { SeriesPoint } from "./compute";
import { earningsCsv, earningsRows } from "./csv";

const ROUND_START = Date.UTC(2026, 8, 1) / 1000;
const CALLED = ROUND_START + 2 * 3600 + 17 * 60;

const point = (p: Partial<SeriesPoint>): SeriesPoint => ({
  round: 10,
  ts: ROUND_START,
  stake: 100,
  rewards: 0,
  commission: 0,
  fees: 0,
  share: null,
  from: "0xorch",
  ...p,
});

describe("earningsRows", () => {
  it("times a row by its orchestrator's reward call when known", () => {
    const [called, uncalled] = earningsRows(
      [
        {
          address: "0xa",
          series: [
            point({ round: 10, rewards: 1 }),
            point({ round: 11, ts: ROUND_START + 86_400, fees: 0.1 }),
            point({ round: 12 }), // nothing earned: no row
          ],
        },
      ],
      new Map([["0xorch:10", CALLED]])
    );
    expect(called).toMatchObject({ ts: CALLED, basis: "Reward call" });
    expect(uncalled).toMatchObject({
      ts: ROUND_START + 86_400,
      basis: "Round start",
    });
  });

  it("orders rows by round across wallets", () => {
    const rows = earningsRows(
      [
        { address: "0xb", series: [point({ round: 2, rewards: 1 })] },
        {
          address: "0xa",
          series: [
            point({ round: 1, rewards: 1 }),
            point({ round: 2, rewards: 1 }),
          ],
        },
      ],
      new Map()
    );
    expect(rows.map((r) => `${r.point.round}:${r.account.address}`)).toEqual([
      "1:0xa",
      "2:0xa",
      "2:0xb",
    ]);
  });
});

describe("earningsCsv", () => {
  it("values each row at its own prices", () => {
    const rows = earningsRows(
      [
        {
          address: "0xabc",
          label: 'Cold, "vault"',
          series: [point({ rewards: 1.5, fees: 0.001 })],
        },
      ],
      new Map([["0xorch:10", CALLED]])
    );
    const [header, row] = earningsCsv(rows, { lpt: [5], eth: [2000] })
      .trim()
      .split("\n");
    expect(header.split(",")).toHaveLength(14);
    expect(row).toBe(
      '2026-09-01T02:17:00Z,Reward call,10,0xabc,"Cold, ""vault""",0xorch,1.5,0,0.001,5,2000,7.5,2,100'
    );
  });

  it("leaves USD blank where a price is unknown", () => {
    const rows = earningsRows(
      [{ address: "0xa", series: [point({ rewards: 2 })] }],
      new Map()
    );
    const cells = earningsCsv(rows, { lpt: [null], eth: [] })
      .trim()
      .split("\n")[1]
      .split(",");
    expect(cells.slice(9, 13)).toEqual(["", "", "", ""]);
  });

  it("neutralises labels a spreadsheet would run as formulas", () => {
    const rows = earningsRows(
      [
        {
          address: "0xa",
          label: "=HYPERLINK(1)",
          series: [point({ rewards: 1 })],
        },
      ],
      new Map()
    );
    expect(earningsCsv(rows, { lpt: [], eth: [] })).toContain(
      ",'=HYPERLINK(1),"
    );
  });
});
