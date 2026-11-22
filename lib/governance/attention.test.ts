import type { CastVote } from "@/lib/subgraph/votes";

import {
  governorStatesLive,
  hasFailedRead,
  leadVoteAttention,
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

describe("leadVoteAttention", () => {
  const holdings = [
    { account: "0xbig", delegate: "0xvoted", stake: 500 },
    { account: "0xsmall", delegate: "0xquiet", stake: 5 },
  ];

  it("leads with stake that isn't counted, even when it's smaller", () => {
    expect(
      leadVoteAttention(vote("p1", 100, [cast("0xvoted", "for")]), holdings)
    ).toMatchObject({ reason: "nobody-voted", account: "0xsmall", others: 0 });
  });

  it("reports the orchestrator's vote once all stake is counted", () => {
    expect(
      leadVoteAttention(
        vote("p1", 100, [cast("0xvoted", "for"), cast("0xquiet", "no")]),
        holdings
      )
    ).toMatchObject({ reason: "delegate-voted", account: "0xbig" });
  });

  it("has nothing to say once every wallet voted itself", () => {
    expect(
      leadVoteAttention(
        vote("p1", 100, [cast("0xbig", "for"), cast("0xsmall", "for")]),
        holdings
      )
    ).toBeNull();
  });
});

describe("contract read polling", () => {
  const ok = (result: unknown) => ({ status: "success", result });
  const failed = { status: "failure" };

  it("retries a batch with a failed read", () => {
    expect(hasFailedRead([ok(1n), failed])).toBe(true);
    expect(hasFailedRead([ok(1n), ok(0n)])).toBe(false);
    expect(hasFailedRead(undefined)).toBe(false);
  });

  it("keeps reading governor state while a proposal can still change", () => {
    expect(governorStatesLive([ok(7), ok(1)])).toBe(true);
    expect(governorStatesLive([ok(0)])).toBe(true);
    expect(governorStatesLive([ok(7), failed])).toBe(true);
  });

  it("stops once every proposal is over", () => {
    expect(governorStatesLive([ok(2), ok(3), ok(7)])).toBe(false);
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
    expect(voteStatus(vote("p1", 100, []), me)).toEqual({ kind: "uncounted" });
  });

  it("flags an orchestrator that hasn't voted", () => {
    expect(
      voteStatus(vote("p1", 100, []), [
        { account: "0xorch", delegate: "0xorch", stake: 50 },
      ])
    ).toEqual({ kind: "not-voted" });
  });
});
