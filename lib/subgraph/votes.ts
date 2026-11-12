import { paginate, querySubgraph } from "./client";

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
  /** `<transaction hash>-<log index in the block>`. */
  id: string;
  voter: string | { id: string };
  timestamp: number;
  transaction: { id: string; blockNumber: string };
};

/** Chain order of an event: block, then its log's position in the block. */
export function chainOrder(e: Pick<RawEvent, "id" | "transaction">) {
  const log = Number(e.id.split("-").pop());
  return [Number(e.transaction.blockNumber), Number.isFinite(log) ? log : 0];
}

const later = (a: RawEvent, b: RawEvent) => {
  const [ab, al] = chainOrder(a);
  const [bb, bl] = chainOrder(b);
  return ab !== bb ? ab > bb : al > bl;
};

const voterId = (v: string | { id: string }) =>
  (typeof v === "string" ? v : v.id).toLowerCase();

function latestEvents(events: RawEvent[]) {
  const map = new Map<string, RawEvent>();
  for (const e of events) {
    const id = voterId(e.voter);
    const prev = map.get(id);
    // By chain order, not timestamp: two votes in one block share a
    // timestamp, and the later one is the voter's current choice.
    if (!prev || later(e, prev)) map.set(id, e);
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
  // A page of ids at a time, so no voter falls past the 1,000-row limit.
  for (let i = 0; i < ids.length; i += 1000) {
    const { delegators } = await querySubgraph<{
      delegators: { id: string; delegate: { id: string } | null }[];
    }>(VOTER_DELEGATES, { ids: ids.slice(i, i + 1000) });
    for (const d of delegators)
      if (d.delegate) map.set(d.id.toLowerCase(), d.delegate.id.toLowerCase());
  }
  return map;
}

/*
 * Votes and their events are paged to completion: a poll or proposal with
 * more than 1,000 voters would otherwise show a subset, with shares worked
 * out against it.
 */

const POLL_VOTES = /* GraphQL */ `
  query PollVotes($poll: String!, $first: Int!, $lastId: String!) {
    votes(first: $first, where: { poll: $poll, id_gt: $lastId }, orderBy: id) {
      id
      voter
      voteStake
      nonVoteStake
      choiceID
      registeredTranscoder
    }
  }
`;

const POLL_VOTE_EVENTS = /* GraphQL */ `
  query PollVoteEvents($poll: String!, $first: Int!, $lastId: String!) {
    voteEvents(
      first: $first
      where: { poll: $poll, id_gt: $lastId }
      orderBy: id
    ) {
      id
      voter
      timestamp
      transaction {
        id
        blockNumber
      }
    }
  }
`;

export async function fetchPollVotes(poll: string): Promise<CastVote[]> {
  const vars = { poll: poll.toLowerCase() };
  const [votes, voteEvents] = await Promise.all([
    paginate<{
      id: string;
      voter: string;
      voteStake: string;
      nonVoteStake: string;
      choiceID: "Yes" | "No" | null;
      registeredTranscoder: boolean | null;
    }>(POLL_VOTES, "votes", vars),
    paginate<RawEvent>(POLL_VOTE_EVENTS, "voteEvents", vars),
  ]);
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
        // An orchestrator's voteStake still counts delegators who voted for
        // themselves; their stake is its nonVoteStake, so take it off, as the
        // previous explorer did. A delegator's nonVoteStake is zero.
        weight: orchestrator
          ? Math.max(0, Number(v.voteStake) - Number(v.nonVoteStake))
          : Number(v.voteStake),
        orchestrator,
        delegate: orchestrator ? null : delegate,
        timestamp: e?.timestamp ?? null,
        tx: e?.transaction.id ?? null,
      } satisfies CastVote;
    })
    .sort((a, b) => b.weight - a.weight);
}

const PROPOSAL_VOTES = /* GraphQL */ `
  query ProposalVotes($proposal: String!, $first: Int!, $lastId: String!) {
    treasuryVotes(
      first: $first
      where: { proposal: $proposal, id_gt: $lastId }
      orderBy: id
    ) {
      id
      voter {
        id
      }
      support
      weight
      reason
    }
  }
`;

const PROPOSAL_VOTE_EVENTS = /* GraphQL */ `
  query ProposalVoteEvents($proposal: String!, $first: Int!, $lastId: String!) {
    treasuryVoteEvents(
      first: $first
      where: { proposal: $proposal, id_gt: $lastId }
      orderBy: id
    ) {
      id
      voter {
        id
      }
      timestamp
      transaction {
        id
        blockNumber
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
  const [treasuryVotes, treasuryVoteEvents] = await Promise.all([
    paginate<{
      id: string;
      voter: { id: string };
      support: string;
      weight: string;
      reason: string | null;
    }>(PROPOSAL_VOTES, "treasuryVotes", { proposal }),
    paginate<RawEvent>(PROPOSAL_VOTE_EVENTS, "treasuryVoteEvents", {
      proposal,
    }),
  ]);
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
