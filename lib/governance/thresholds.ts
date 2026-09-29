/** LivepeerGovernor's `quota()` is in parts per million. */
const QUOTA_PRECISION = 1_000_000;

export type ProposalThresholds = {
  /** Share of voting power that must vote (For, Against or Abstain), %. */
  quorum: number;
  /** Share of voting power that did vote, %. */
  participation: number;
  quorumReached: boolean;
  /** For's share of For + Against that must be exceeded, %. */
  quota: number;
  /** For's share of For + Against, %. Null before any For or Against vote. */
  forShare: number | null;
  quotaMet: boolean;
};

/**
 * A treasury proposal's quorum and quota, as LivepeerGovernor applies them:
 * quorum counts every vote against the total voting power at the snapshot
 * round; quota compares For to For + Against, so abstaining counts towards
 * quorum but not the outcome.
 */
export function proposalThresholds({
  quorumVotes,
  totalSupply,
  quotaPpm,
  forVotes,
  againstVotes,
  abstainVotes,
}: {
  /** `quorum(snapshot)`, in LPT. */
  quorumVotes: number;
  /** `BondingVotes.getPastTotalSupply(snapshot)`, in LPT. */
  totalSupply: number;
  quotaPpm: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
}): ProposalThresholds | null {
  if (!(totalSupply > 0)) return null;
  const cast = forVotes + againstVotes + abstainVotes;
  const decisive = forVotes + againstVotes;
  const quota = (quotaPpm / QUOTA_PRECISION) * 100;
  const forShare = decisive > 0 ? (forVotes / decisive) * 100 : null;
  return {
    quorum: (quorumVotes / totalSupply) * 100,
    participation: (cast / totalSupply) * 100,
    quorumReached: cast >= quorumVotes,
    quota,
    forShare,
    quotaMet: forShare != null && forShare > quota,
  };
}
