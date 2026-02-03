import {
  useTranscoderActivationHistoryQuery,
  useTreasuryProposalsQuery,
  useTreasuryVotesQuery,
} from "apollo";
import { useMemo } from "react";

type ActivationWindow = { start: number; end: number };
type Participation = { voted: number; eligible: number };

const buildActiveWindows = (
  activations: { activationRound: string }[],
  deactivations: { deactivationRound: string }[]
): ActivationWindow[] => {
  const timeline = [
    ...activations.map((a) => ({
      round: Number(a.activationRound),
      type: "activation" as const,
    })),
    ...deactivations.map((d) => ({
      round: Number(d.deactivationRound),
      type: "deactivation" as const,
    })),
  ].sort((a, b) => a.round - b.round || (a.type === "deactivation" ? -1 : 1));

  const windows: ActivationWindow[] = [];
  let start: number | null = null;

  for (const { type, round } of timeline) {
    if (type === "activation") {
      start = round;
    } else if (start !== null && round > start) {
      windows.push({ start, end: round });
      start = null;
    }
  }

  return start !== null
    ? [...windows, { start, end: Number.POSITIVE_INFINITY }]
    : windows;
};

const isDuringWindow = (round: number, windows: ActivationWindow[]) =>
  windows.some((w) => round >= w.start && round < w.end);

export const useGovernanceParticipation = (
  delegateId?: string
): { treasury: Participation | null; loading: boolean } => {
  const hasDelegate = Boolean(delegateId);

  const { data: activationData, loading: activationLoading } =
    useTranscoderActivationHistoryQuery({
      variables: { delegate: delegateId ?? "" },
      fetchPolicy: "cache-and-network",
      skip: !hasDelegate,
    });

  const { data: votesData, loading: votesLoading } = useTreasuryVotesQuery({
    variables: { where: { voter: delegateId ?? "" } },
    fetchPolicy: "cache-and-network",
    skip: !hasDelegate,
  });

  const activations = useMemo(
    () => activationData?.transcoderActivatedEvents ?? [],
    [activationData?.transcoderActivatedEvents]
  );
  const deactivations = useMemo(
    () => activationData?.transcoderDeactivatedEvents ?? [],
    [activationData?.transcoderDeactivatedEvents]
  );

  const firstActivationRound = activations[0]?.activationRound;
  const hasMultipleWindows =
    activations.length > 1 || (deactivations?.length ?? 0) > 0;

  const windows = useMemo(
    () =>
      hasMultipleWindows ? buildActiveWindows(activations, deactivations) : [],
    [activations, deactivations, hasMultipleWindows]
  );

  const { data: proposalsData, loading: proposalsLoading } =
    useTreasuryProposalsQuery({
      variables: firstActivationRound
        ? { where: { voteStart_gte: firstActivationRound } }
        : undefined,
      skip: !firstActivationRound,
      fetchPolicy: "cache-and-network",
    });

  const treasuryParticipation = useMemo<Participation | null>(() => {
    if (!proposalsData || !votesData) return null;
    if (!firstActivationRound) return null;

    if (!hasMultipleWindows) {
      return {
        voted: votesData.treasuryVotes?.length ?? 0,
        eligible: proposalsData.treasuryProposals?.length ?? 0,
      };
    }

    const eligible = proposalsData.treasuryProposals.filter((proposal) =>
      isDuringWindow(Number(proposal.voteStart), windows)
    ).length;
    const voted = votesData.treasuryVotes.filter((vote) =>
      isDuringWindow(Number(vote.proposal.voteStart), windows)
    ).length;
    return { voted, eligible };
  }, [
    proposalsData,
    votesData,
    firstActivationRound,
    hasMultipleWindows,
    windows,
  ]);

  return {
    treasury: treasuryParticipation,
    loading: activationLoading || votesLoading || proposalsLoading,
  };
};
