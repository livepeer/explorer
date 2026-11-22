import type { CastVote } from "@/lib/subgraph/votes";

import {
  type OpenVote,
  snapshotHoldings,
  voteAttention,
  voteStatus,
} from "./attention";

const cast = (voter: string, choice: CastVote["choice"]): CastVote => ({
  voter,
  choice,
  weight: 1,
  orchestrator: false,
  delegate: null,
  timestamp: null,
  tx: null,
});

const vote = (id: string, closesAt: number, casts: CastVote[]): OpenVote => ({
  id,
  kind: "proposal",
  title: id,
  closesAt,
  casts,
});

describe("voteAttention", () => {
  it("tells a delegator how its orchestrator voted", () => {
    const [item, ...rest] = voteAttention(
      [vote("p1", 100, [cast("0xorch", "for")])],
      [{ account: "0xme", delegate: "0xorch", stake: 50 }]
    );
    expect(rest).toHaveLength(0);
    expect(item).toMatchObject({
      reason: "delegate-voted",
      orchestrator: "0xorch",
      choice: "for",
      account: "0xme",
    });
  });

  it("leaves a wallet alone once it voted itself", () => {
    expect(
      voteAttention(
        [vote("p1", 100, [cast("0xorch", "for"), cast("0xme", "against")])],
        [{ account: "0xme", delegate: "0xorch", stake: 50 }]
      )
    ).toEqual([]);
  });

  it("asks an orchestrator in the portfolio to vote", () => {
    const [item] = voteAttention(
      [vote("p1", 100, [])],
      [{ account: "0xorch", delegate: "0xorch", stake: 50 }]
    );
    expect(item.reason).toBe("orchestrator-not-voted");
  });

  it("says when neither has voted", () => {
    const [item] = voteAttention(
      [vote("p1", 100, [])],
      [{ account: "0xme", delegate: "0xorch", stake: 50 }]
    );
    expect(item).toMatchObject({
      reason: "nobody-voted",
      orchestrator: "0xorch",
    });
  });

  it("uses the largest pending position, counts the rest, and ignores unstaked wallets", () => {
    const [item] = voteAttention(
      [vote("p1", 100, [cast("0xa", "for")])],
      [
        { account: "0xa", delegate: "0xo1", stake: 500 },
        { account: "0xb", delegate: "0xo1", stake: 20 },
        { account: "0xc", delegate: "0xo2", stake: 80 },
        { account: "0xd", delegate: "0xo2", stake: 0 },
        { account: "0xe", delegate: null, stake: 10 },
      ]
    );
    expect(item.account).toBe("0xc");
    expect(item.others).toBe(1);
  });

  it("orders by what closes first", () => {
    const items = voteAttention(
      [vote("late", 300, []), vote("soon", 100, [])],
      [{ account: "0xme", delegate: "0xorch", stake: 50 }]
    );
    expect(items.map((i) => i.vote.id)).toEqual(["soon", "late"]);
  });
});

describe("voteAttention with a preferred wallet", () => {
  const holdings = [
    { account: "0xbig", delegate: "0xorch", stake: 500 },
    { account: "0xME", delegate: "0xorch", stake: 5 },
  ];

  it("asks the connected wallet first, even when it's smaller", () => {
    const [item] = voteAttention([vote("p1", 100, [])], holdings, "0xme");
    expect(item).toMatchObject({ account: "0xme", others: 1 });
  });

  it("falls back to the largest once the connected wallet voted", () => {
    const [item] = voteAttention(
      [vote("p1", 100, [cast("0xme", "for")])],
      holdings,
      "0xme"
    );
    expect(item).toMatchObject({ account: "0xbig", others: 0 });
  });
});

describe("snapshotHoldings", () => {
  const LPT = 10n ** 18n;
  const none = "0x0000000000000000000000000000000000000000";

  it("uses the stake and delegate at the snapshot", () => {
    expect(snapshotHoldings(["0xme"], [5n * LPT], ["0xold"])).toEqual([
      { account: "0xme", delegate: "0xold", stake: 5 },
    ]);
  });

  it("leaves out wallets with no voting power at the snapshot", () => {
    expect(
      snapshotHoldings(["0xa", "0xb"], [0n, LPT], ["0xorch", none])
    ).toEqual([]);
  });

  it("is unknown if any account couldn't be read", () => {
    expect(
      snapshotHoldings(["0xa", "0xb"], [LPT, undefined], ["0xorch", "0xorch"])
    ).toBeNull();
  });
});

describe("voteStatus", () => {
  const me = [{ account: "0xme", delegate: "0xorch", stake: 50 }];

  it("is empty with nothing staked", () => {
    expect(voteStatus(vote("p1", 100, []), [])).toBeNull();
    expect(
      voteStatus(vote("p1", 100, []), [{ ...me[0], stake: 0 }])
    ).toBeNull();
  });

  it("knows the wallet voted itself", () => {
    expect(voteStatus(vote("p1", 100, [cast("0xme", "for")]), me)).toEqual({
      kind: "voted",
    });
  });

  it("reports how the orchestrator voted with the stake", () => {
    expect(voteStatus(vote("p1", 100, [cast("0xorch", "no")]), me)).toEqual({
      kind: "delegate-voted",
      choice: "no",
    });
  });

  it("flags a vote neither has cast", () => {
    expect(voteStatus(vote("p1", 100, []), me)).toEqual({ kind: "not-voted" });
  });
});
