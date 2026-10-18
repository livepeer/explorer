import { ApolloClient, useApolloClient } from "@apollo/client";
import { useEffect, useMemo, useState } from "react";

import {
  GovernanceParticipationDocument,
  GovernanceParticipationQuery,
  GovernanceParticipationQueryVariables,
} from "../apollo/subgraph";
import {
  calculateParticipation,
  GovernanceHistory,
} from "../lib/governanceParticipation";

export const GOVERNANCE_PAGE_SIZE = 1000;

export async function loadGovernanceHistory(
  client: ApolloClient<object>,
  delegate: string,
  signal: AbortSignal
): Promise<GovernanceHistory> {
  const history: GovernanceHistory = {
    activations: [],
    deactivations: [],
    proposals: [],
    votes: [],
  };
  const variables: GovernanceParticipationQueryVariables = {
    delegate,
    first: GOVERNANCE_PAGE_SIZE,
    activationCursor: "",
    deactivationCursor: "",
    proposalCursor: "",
    voteCursor: "",
    includeActivations: true,
    includeDeactivations: true,
    includeProposals: true,
    includeVotes: true,
  };

  do {
    const { data } = await client.query<
      GovernanceParticipationQuery,
      GovernanceParticipationQueryVariables
    >({
      query: GovernanceParticipationDocument,
      variables: { ...variables },
      fetchPolicy: "no-cache",
      // Each load owns its signal, including React's development remounts.
      context: { queryDeduplication: false, fetchOptions: { signal } },
    });
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    if (!data._meta) throw new Error("Missing governance history block");
    // All subsequent pages must describe the same indexed block.
    variables.block = { number: data._meta.block.number };

    const activations = data.transcoderActivatedEvents ?? [];
    const deactivations = data.transcoderDeactivatedEvents ?? [];
    const proposals = data.treasuryProposals ?? [];
    const votes = data.treasuryVotes ?? [];
    history.activations.push(...activations);
    history.deactivations.push(...deactivations);
    history.proposals.push(...proposals);
    history.votes.push(...votes);

    variables.activationCursor =
      activations.at(-1)?.id ?? variables.activationCursor;
    variables.deactivationCursor =
      deactivations.at(-1)?.id ?? variables.deactivationCursor;
    variables.proposalCursor = proposals.at(-1)?.id ?? variables.proposalCursor;
    variables.voteCursor = votes.at(-1)?.id ?? variables.voteCursor;
    variables.includeActivations = activations.length === GOVERNANCE_PAGE_SIZE;
    variables.includeDeactivations =
      deactivations.length === GOVERNANCE_PAGE_SIZE;
    variables.includeProposals = proposals.length === GOVERNANCE_PAGE_SIZE;
    variables.includeVotes = votes.length === GOVERNANCE_PAGE_SIZE;
  } while (
    variables.includeActivations ||
    variables.includeDeactivations ||
    variables.includeProposals ||
    variables.includeVotes
  );
  return history;
}

type HistoryState = {
  delegateId: string;
  currentRoundId: string;
  history?: GovernanceHistory;
  error?: Error;
};

export function useGovernanceParticipation(
  delegateId?: string,
  currentRoundId?: string
) {
  const client = useApolloClient();
  const [state, setState] = useState<HistoryState | null>(null);
  useEffect(() => {
    if (!delegateId || !currentRoundId) return;
    const controller = new AbortController();
    loadGovernanceHistory(client, delegateId, controller.signal).then(
      (history) => {
        if (!controller.signal.aborted) {
          setState({ delegateId, currentRoundId, history });
        }
      },
      (error: Error) => {
        if (!controller.signal.aborted) {
          setState({ delegateId, currentRoundId, error });
        }
      }
    );
    return () => controller.abort();
  }, [client, delegateId, currentRoundId]);

  const current =
    state?.delegateId === delegateId && state?.currentRoundId === currentRoundId
      ? state
      : null;
  const treasury = useMemo(
    () =>
      current?.history && currentRoundId
        ? calculateParticipation(current.history, currentRoundId)
        : null,
    [current, currentRoundId]
  );
  return {
    treasury,
    loading: Boolean(delegateId && currentRoundId && !current),
    error: current?.error,
  };
}
