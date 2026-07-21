/**
 * TEMPORARY stopgap: manually surface governance polls that were created while
 * the subgraph was behind on indexing, so voting stays functional during the
 * outage. Entries are shaped like subgraph poll results and merged into the
 * voting list/detail pages, deduped by poll address — once the subgraph
 * reindexes a poll, its real (tallied) copy wins and the manual entry drops out.
 *
 * The subgraph normally computes the stake-weighted counts, so these carry no
 * tally of their own: the UI fills it in from `/api/polls/tally/[poll]`, which
 * recomputes it from chain state. Voting itself is on-chain and works regardless.
 *
 * Remove entries (or delete this file and its imports) once indexing recovers.
 */

import { PollTally } from "@lib/api/types/get-poll-tally";
import { PollsQuery } from "apollo";

type SubgraphPoll = PollsQuery["polls"][number];

type ManualPoll = SubgraphPoll & {
  /** L2 block the poll was created in — lower bound for on-chain vote lookups. */
  startBlockL2: number;
};

export const MANUAL_POLLS: ManualPoll[] = [
  {
    // LIP-118 "Delegated Reward Calling" — created during the subgraph indexing halt.
    // tx: 0xb8ab2a824b4a5b16b76be99f1313a8238f35acc2259b139562277e1df8ba02e4
    __typename: "Poll",
    id: "0x74479927117d4158b32c03d5400c14bdd7e6a46a",
    proposal: "QmcYGZp3SipMEz699bpeZqocdouYWTE2zHG8TMdaSYqowF",
    endBlock: "25622119",
    quorum: "333300",
    quota: "500000",
    tally: null,
    votes: [],
    startBlockL2: 485384564,
  },
];

const norm = (id: string) => id.toLowerCase();

/** The manually-listed poll for `id`, if any. */
export const getManualPoll = (
  id: string | undefined | null
): ManualPoll | undefined =>
  id ? MANUAL_POLLS.find((p) => norm(p.id) === norm(id)) : undefined;

/** Whether `id` is a manually-listed poll (i.e. not sourced from the subgraph). */
export const isManualPoll = (id: string | undefined | null): boolean =>
  Boolean(getManualPoll(id));

/**
 * Merge manual polls into a subgraph poll list, deduped by address. The subgraph
 * copy takes precedence, so a poll that has since been indexed is not duplicated.
 */
export const mergeManualPolls = (
  polls: SubgraphPoll[] | undefined
): SubgraphPoll[] => {
  const list = polls ? [...polls] : [];
  const seen = new Set(list.map((p) => norm(p.id)));
  for (const poll of MANUAL_POLLS) {
    if (!seen.has(norm(poll.id))) list.push(poll);
  }
  return list;
};

/**
 * Fill a manual poll's missing tally with the one computed on-chain by
 * `/api/polls/tally/[poll]`. Subgraph-sourced polls are returned untouched, so
 * this becomes a no-op as soon as indexing catches up.
 */
export const withManualTally = (
  poll: SubgraphPoll,
  tally: PollTally | undefined | null
): SubgraphPoll => {
  if (!tally || norm(tally.poll) !== norm(poll.id) || !isManualPoll(poll.id)) {
    return poll;
  }

  return {
    ...poll,
    tally: { __typename: "PollTally", ...tally.tally },
    // The list/widget show a vote count, which the subgraph would supply.
    votes: tally.votes.map((vote) => ({
      __typename: "Vote" as const,
      id: `${vote.voter}-${norm(poll.id)}`,
    })),
  };
};
