import { PollsQuery } from "apollo";

/**
 * TEMPORARY stopgap: manually surface governance polls that were created while
 * the subgraph was behind on indexing, so voting stays functional during the
 * outage. Entries are shaped like subgraph poll results and merged into the
 * voting list/detail pages, deduped by poll address — once the subgraph
 * reindexes a poll, its real (tallied) copy wins and the manual entry drops out.
 *
 * These carry no vote tally (the subgraph computes the stake-weighted counts),
 * so the UI shows a "counts not loaded" note for them; voting itself is on-chain
 * and works regardless.
 *
 * Remove entries (or delete this file and its imports) once indexing recovers.
 */
type SubgraphPoll = PollsQuery["polls"][number];

export const MANUAL_POLLS: SubgraphPoll[] = [
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
  },
];

const norm = (id: string) => id.toLowerCase();

/** The manually-listed poll for `id`, if any. */
export const getManualPoll = (
  id: string | undefined | null
): SubgraphPoll | undefined =>
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
