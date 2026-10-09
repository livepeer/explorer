import { querySubgraph } from "./client";

/*
 * Who voted on a poll or treasury proposal. One entity per voter carries the
 * current choice and stake weight; the vote events add when it was cast and
 * the transaction (the latest event wins if a voter changed their mind).
 */

export type VoteChoice = "yes" | "no" | "for" | "against" | "abstain";

export type CastVote = {
  voter: string;
  choice: VoteChoice;
  /** Stake-weighted voting power in LPT. */
  weight: number;
  /** The voter is an orchestrator (registered, or bonded to itself). */
  orchestrator: boolean;
  /** Orchestrator the voter delegates to, when a delegator. */
  delegate: string | null;
  /** Treasury votes: optional reason given on-chain. */
  reason?: string;
  timestamp: number | null;
  tx: string | null;
};

type RawEvent = {
  voter: string | { id: string };
  timestamp: number;
  transaction: { id: string };
};

const voterId = (v: string | { id: string }) =>
  (typeof v === "string" ? v : v.id).toLowerCase();

function latestEvents(events: RawEvent[]) {
  const map = new Map<string, RawEvent>();
  for (const e of events) {
    const id = voterId(e.voter);
    const prev = map.get(id);
    if (!prev || e.timestamp > prev.timestamp) map.set(id, e);
  }
  return map;
}

const VOTER_DELEGATES = /* GraphQL */ `
  query VoterDelegates($ids: [ID!]!) {
    delegators(first: 1000, where: { id_in: $ids }) {
      id
      delegate {
        id
      }
    }
  }
`;

/** Who each voter delegates to; an orchestrator is bonded to itself. */
async function fetchDelegates(ids: string[]) {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { delegators } = await querySubgraph<{
    delegators: { id: string; delegate: { id: string } | null }[];
  }>(VOTER_DELEGATES, { ids });
  for (const d of delegators)
    if (d.delegate) map.set(d.id.toLowerCase(), d.delegate.id.toLowerCase());
  return map;
}

const POLL_VOTES = /* GraphQL */ `
  query PollVotes($poll: String!) {
    votes(first: 1000, where: { poll: $poll }) {
      voter
      voteStake
      nonVoteStake
      choiceID
      registeredTranscoder
    }
    voteEvents(
      first: 1000
      where: { poll: $poll }
      orderBy: timestamp
      orderDirection: desc
    ) {
      voter
      timestamp
      transaction {
        id
      }
    }
  }
`;

export async function fetchPollVotes(poll: string): Promise<CastVote[]> {
  const { votes, voteEvents } = await querySubgraph<{
    votes: {
      voter: string;
      voteStake: string;
      nonVoteStake: string;
      choiceID: "Yes" | "No" | null;
      registeredTranscoder: boolean | null;
    }[];
    voteEvents: RawEvent[];
  }>(POLL_VOTES, { poll: poll.toLowerCase() });
  const events = latestEvents(voteEvents);
  const cast = votes.filter((v) => v.choiceID);
  const delegates = await fetchDelegates(
    cast.map((v) => v.voter.toLowerCase())
  );
  return cast
    .map((v) => {
      const id = v.voter.toLowerCase();
      const e = events.get(id);
      const delegate = delegates.get(id) ?? null;
      const orchestrator = Boolean(v.registeredTranscoder) || delegate === id;
      return {
        voter: id,
        choice: v.choiceID === "Yes" ? "yes" : "no",
        weight: Number(v.voteStake),
        orchestrator,
        delegate: orchestrator ? null : delegate,
        timestamp: e?.timestamp ?? null,
        tx: e?.transaction.id ?? null,
      } satisfies CastVote;
    })
    .sort((a, b) => b.weight - a.weight);
}

const PROPOSAL_VOTES = /* GraphQL */ `
  query ProposalVotes($proposal: String!) {
    treasuryVotes(first: 1000, where: { proposal: $proposal }) {
      voter {
        id
      }
      support
      weight
      reason
    }
    treasuryVoteEvents(
      first: 1000
      where: { proposal: $proposal }
      orderBy: timestamp
      orderDirection: desc
    ) {
      voter {
        id
      }
      timestamp
      transaction {
        id
      }
    }
  }
`;

const SUPPORT: Record<string, VoteChoice> = {
  For: "for",
  Against: "against",
  Abstain: "abstain",
};

export async function fetchProposalVotes(
  proposal: string
): Promise<CastVote[]> {
  const { treasuryVotes, treasuryVoteEvents } = await querySubgraph<{
    treasuryVotes: {
      voter: { id: string };
      support: string;
      weight: string;
      reason: string | null;
    }[];
    treasuryVoteEvents: RawEvent[];
  }>(PROPOSAL_VOTES, { proposal });
  const events = latestEvents(treasuryVoteEvents);
  const cast = treasuryVotes.filter((v) => SUPPORT[v.support]);
  const delegates = await fetchDelegates(
    cast.map((v) => v.voter.id.toLowerCase())
  );
  return cast
    .map((v) => {
      const id = v.voter.id.toLowerCase();
      const e = events.get(id);
      const delegate = delegates.get(id) ?? null;
      const orchestrator = delegate === id;
      return {
        voter: id,
        choice: SUPPORT[v.support],
        weight: Number(v.weight),
        orchestrator,
        delegate: orchestrator ? null : delegate,
        reason: v.reason?.trim() || undefined,
        timestamp: e?.timestamp ?? null,
        tx: e?.transaction.id ?? null,
      } satisfies CastVote;
    })
    .sort((a, b) => b.weight - a.weight);
}

/* ── Who could vote: the active set at the vote's snapshot round ─────────── */

export type Electorate = {
  /** Round the set and stake are from; null means "today". */
  round: number | null;
  /** Today's set standing in because the vote's round isn't indexed. */
  fallback?: boolean;
  orchestrators: { id: string; totalStake: number }[];
};

const ROUND_AT_BLOCK = /* GraphQL */ `
  query RoundAtBlock($block: BigInt!) {
    rounds(
      first: 1
      where: { startBlock_lte: $block }
      orderBy: startBlock
      orderDirection: desc
    ) {
      id
    }
  }
`;

/** The round an L1 block falls in (poll end blocks are L1 blocks). */
export async function fetchRoundAtBlock(block: number) {
  const { rounds } = await querySubgraph<{ rounds: { id: string }[] }>(
    ROUND_AT_BLOCK,
    { block: String(block) }
  );
  return rounds[0] ? Number(rounds[0].id) : null;
}

const ROUND_POOLS = /* GraphQL */ `
  query RoundPools($round: String!) {
    pools(first: 1000, where: { round: $round, totalStake_gt: "0" }) {
      delegate {
        id
      }
      totalStake
    }
  }
`;

/**
 * Orchestrators active in a round, with their stake that round. The
 * subgraph creates one earnings pool per active orchestrator per round, so
 * a round's pools are its active set. Null if the round has no pools yet.
 */
export async function fetchElectorate(
  round: number
): Promise<Electorate | null> {
  const { pools } = await querySubgraph<{
    pools: { delegate: { id: string }; totalStake: string }[];
  }>(ROUND_POOLS, { round: String(round) });
  if (!pools.length) return null;
  return {
    round,
    orchestrators: pools
      .map((p) => ({
        id: p.delegate.id.toLowerCase(),
        totalStake: Number(p.totalStake),
      }))
      .sort((a, b) => b.totalStake - a.totalStake),
  };
}
