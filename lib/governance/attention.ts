import type { CastVote, VoteChoice } from "@/lib/subgraph/votes";

/**
 * Open votes that need the portfolio's attention. Livepeer votes are
 * stake-weighted and delegated by default: an orchestrator's vote carries
 * its delegators' stake unless a delegator votes themselves, which
 * overrides it for their share. So, per open vote:
 *
 * - an orchestrator in the portfolio that hasn't voted is asked to;
 * - a delegator whose orchestrator voted is told how its stake was cast,
 *   and can override it;
 * - a delegator whose orchestrator hasn't voted is told that neither has.
 *
 * Wallets that voted themselves are left alone. One item per vote, for the
 * largest position that still has something to do.
 */

export type OpenVote = {
  id: string;
  kind: "proposal" | "poll";
  title: string;
  /** Estimated unix time (s) voting closes. */
  closesAt: number;
  casts: CastVote[];
};

export type Holding = {
  account: string;
  delegate: string | null;
  stake: number;
};

export type VoteAttention = {
  vote: OpenVote;
  account: string;
  /** Other wallets in the portfolio in the same situation. */
  others: number;
} & (
  | { reason: "orchestrator-not-voted" }
  | { reason: "delegate-voted"; orchestrator: string; choice: VoteChoice }
  | { reason: "nobody-voted"; orchestrator: string }
);

export function voteAttention(
  votes: OpenVote[],
  holdings: Holding[]
): VoteAttention[] {
  const out: VoteAttention[] = [];
  const staked = holdings
    .filter((h) => h.delegate && h.stake > 0)
    .sort((a, b) => b.stake - a.stake);
  for (const vote of [...votes].sort((a, b) => a.closesAt - b.closesAt)) {
    const cast = new Map(vote.casts.map((c) => [c.voter.toLowerCase(), c]));
    const pending = staked.filter((h) => !cast.has(h.account.toLowerCase()));
    if (!pending.length) continue;
    const [h] = pending;
    const account = h.account.toLowerCase();
    const orchestrator = h.delegate!.toLowerCase();
    const base = { vote, account, others: pending.length - 1 };
    if (orchestrator === account) {
      out.push({ ...base, reason: "orchestrator-not-voted" });
      continue;
    }
    const theirs = cast.get(orchestrator);
    out.push(
      theirs
        ? {
            ...base,
            reason: "delegate-voted",
            orchestrator,
            choice: theirs.choice,
          }
        : { ...base, reason: "nobody-voted", orchestrator }
    );
  }
  return out;
}
