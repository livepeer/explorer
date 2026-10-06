type ChainEvent = {
  id: string;
  transaction: { blockNumber: string };
};

export type ActivationEvent = ChainEvent & { activationRound: string };
export type DeactivationEvent = ChainEvent & { deactivationRound: string };
export type ActivationWindow = { start: number; end: number };
export type Participation = { voted: number; total: number };
export type GovernanceHistory = {
  activations: ActivationEvent[];
  deactivations: DeactivationEvent[];
  proposals: { id: string; voteStart: string }[];
  votes: { id: string; proposal: { id: string } }[];
};

// The subgraph's event IDs are <transaction hash>-<block-wide log index>.
// Effective rounds alone cannot order changes that cancel each other out.
const compareEvents = (a: ChainEvent, b: ChainEvent) => {
  const blockA = BigInt(a.transaction.blockNumber);
  const blockB = BigInt(b.transaction.blockNumber);
  if (blockA !== blockB) return blockA < blockB ? -1 : 1;
  return Number(a.id.split("-").pop()) - Number(b.id.split("-").pop());
};

export const buildActiveWindows = (
  activations: ActivationEvent[],
  deactivations: DeactivationEvent[]
): ActivationWindow[] => {
  const timeline = [
    ...activations.map((event) => ({
      ...event,
      round: Number(event.activationRound),
      type: "activation" as const,
    })),
    ...deactivations.map((event) => ({
      ...event,
      round: Number(event.deactivationRound),
      type: "deactivation" as const,
    })),
  ].sort(compareEvents);

  const windows: ActivationWindow[] = [];
  let start: number | null = null;
  for (const { type, round } of timeline) {
    if (type === "activation") {
      // A repeated activation must not discard the beginning of an open window.
      if (start === null) start = round;
    } else if (start !== null && round >= start) {
      // Windows include activation and exclude deactivation: [start, end).
      if (round > start) windows.push({ start, end: round });
      start = null;
    }
    // An unmatched deactivation supplies no known active interval.
  }
  if (start !== null) windows.push({ start, end: Number.POSITIVE_INFINITY });
  return windows;
};

export const calculateParticipation = (
  history: GovernanceHistory,
  currentRoundId: string
): Participation => {
  const windows = buildActiveWindows(
    history.activations,
    history.deactivations
  );
  const currentRound = Number(currentRoundId);
  const proposalsWhileActive = new Set(
    history.proposals
      .filter(({ voteStart }) => {
        // Governor keeps proposals pending through their snapshot round.
        const votingStartRound = Number(voteStart) + 1;
        return (
          votingStartRound <= currentRound &&
          windows.some(
            ({ start, end }) =>
              votingStartRound >= start && votingStartRound < end
          )
        );
      })
      .map(({ id }) => id)
  );
  // Count the same proposal set in both terms, once per proposal.
  const voted = new Set(
    history.votes
      .filter(({ proposal }) => proposalsWhileActive.has(proposal.id))
      .map(({ proposal }) => proposal.id)
  ).size;
  return { voted, total: proposalsWhileActive.size };
};
