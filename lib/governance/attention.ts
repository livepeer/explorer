import { fromWei } from "@/lib/format";
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
 * connected wallet if it still has something to do, else the largest
 * position that does.
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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Treasury votes count the stake and delegate at the proposal's snapshot,
 * not today's. Null unless every account's snapshot was read: a partial
 * answer could wrongly report that nobody is left to vote.
 */
export function snapshotHoldings(
  accounts: string[],
  power: (bigint | undefined)[],
  delegates: (string | undefined)[]
): Holding[] | null {
  const out: Holding[] = [];
  for (const [i, account] of accounts.entries()) {
    const amount = power[i];
    const delegate = delegates[i];
    if (amount === undefined || delegate === undefined) return null;
    if (amount > 0n && delegate.toLowerCase() !== ZERO_ADDRESS) {
      out.push({ account, delegate, stake: fromWei(amount) });
    }
  }
  return out;
}

/** Where a portfolio's stake stands on a vote; null with nothing staked. */
export type VoteStatus =
  | { kind: "voted" }
  | { kind: "delegate-voted"; choice: VoteChoice }
  | { kind: "not-voted" };

export function voteStatus(
  vote: OpenVote,
  holdings: Holding[]
): VoteStatus | null {
  if (!holdings.some((h) => h.delegate && h.stake > 0)) return null;
  const [item] = voteAttention([vote], holdings);
  if (!item) return { kind: "voted" };
  return item.reason === "delegate-voted"
    ? { kind: "delegate-voted", choice: item.choice }
    : { kind: "not-voted" };
}

/**
 * The one thing to say about a vote. A wallet whose stake isn't counted yet
 * comes before one whose orchestrator already voted for it, however large.
 */
export function leadVoteAttention(
  vote: OpenVote,
  holdings: Holding[],
  prefer?: string | null
): VoteAttention | null {
  const cast = new Set(vote.casts.map((c) => c.voter.toLowerCase()));
  const uncounted = holdings.filter(
    (h) =>
      !cast.has(h.account.toLowerCase()) &&
      !(h.delegate && cast.has(h.delegate.toLowerCase()))
  );
  const [item] = voteAttention(
    [vote],
    uncounted.length ? uncounted : holdings,
    prefer
  );
  return item ?? null;
}

export function voteAttention(
  votes: OpenVote[],
  holdings: Holding[],
  /** Asked about first, whatever its size: the wallet that can act now. */
  prefer?: string | null
): VoteAttention[] {
  const out: VoteAttention[] = [];
  const first = prefer?.toLowerCase();
  const rank = (h: Holding) => (h.account.toLowerCase() === first ? 1 : 0);
  const staked = holdings
    .filter((h) => h.delegate && h.stake > 0)
    .sort((a, b) => rank(b) - rank(a) || b.stake - a.stake);
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
