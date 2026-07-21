import { AccountBalance } from "@lib/api/types/get-account-balance";
import {
  AvailablePipelines,
  Pipeline,
} from "@lib/api/types/get-available-pipelines";
import { GetChangefeed } from "@lib/api/types/get-changefeed";
import { HomeChartData } from "@lib/api/types/get-chart-data";
import { ContractInfo } from "@lib/api/types/get-contract-info";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { L1Delegator } from "@lib/api/types/get-l1-delegator";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import {
  AllPerformanceMetrics,
  PerformanceMetrics,
} from "@lib/api/types/get-performance";
import { PollTally } from "@lib/api/types/get-poll-tally";
import { ProtocolDayData } from "@lib/api/types/get-protocol-day-data";
import { Regions } from "@lib/api/types/get-regions";
import { SupplyChangeData } from "@lib/api/types/get-supply-change";
import {
  ProposalState,
  ProposalVotingPower,
  RegisteredToVote,
  VotingPower,
} from "@lib/api/types/get-treasury-proposal";
import { UnbondingLocks } from "@lib/api/types/get-unbonding-locks";
import { formatAddress } from "@utils/web3";
import { isManualPoll } from "constants/manualPolls";
import useSWR from "swr";
import { Address } from "viem";

export const useRegionsData = (): Regions => {
  const { data } = useSWR<Regions>(`/regions`);

  return (
    data ?? { regions: [{ id: "GLOBAL", name: "Global", type: "transcoding" }] }
  );
};

export const useEnsData = (address: string | undefined | null): EnsIdentity => {
  const { data, isValidating, error } = useSWR<EnsIdentity>(
    address ? `/ens-data/${address.toLowerCase()}` : null
  );

  const fallbackIdentity: EnsIdentity = {
    id: address ?? "",
    idShort: formatAddress(address),
    name: null,
  };

  return {
    ...(data ?? fallbackIdentity),
    isLoading: Boolean(address && !data && isValidating && !error),
  };
};

export const useAllEnsData = (): EnsIdentity[] => {
  const { data } = useSWR<EnsIdentity[]>(`/ens-data`);

  return data ?? [];
};

export const useChartData = () => {
  const { data } = useSWR<HomeChartData>(`/usage`);

  return data ?? null;
};

export const useProtocolDayData = () => {
  const { data } = useSWR<ProtocolDayData>(`/protocol-day-data`);

  return data ?? null;
};

export const useChangefeedData = () => {
  const { data } = useSWR<GetChangefeed>(`/changefeed`);

  return data ?? null;
};

export const useSupplyChangeData = () => {
  // Round-keyed cache: only refetch when the round changes.
  const round = useCurrentRoundData();
  const { data, error, isValidating } = useSWR<SupplyChangeData>(
    round?.id ? `/supply-change?round=${round.id}` : null
  );

  return {
    data: data ?? null,
    isLoading: Boolean(round?.id && !data && isValidating && !error),
    error,
  };
};

export const useAvailableInferencePipelinesData = () => {
  const { data, isValidating } = useSWR<AvailablePipelines>(`/pipelines`);
  return { data: data ?? { pipelines: [] }, isValidating };
};

export const useAllScoreData = (
  pipeline: Pipeline["id"] | null,
  model: string | null
) => {
  const url =
    pipeline && model
      ? `/score?pipeline=${encodeURIComponent(
          pipeline
        )}&model=${encodeURIComponent(model)}`
      : `/score`;

  const { data, isValidating } = useSWR<AllPerformanceMetrics>(url);

  return { data: data ?? null, isValidating };
};

export const useScoreData = (address: string | undefined | null) => {
  const { data } = useSWR<PerformanceMetrics>(
    address ? `/score/${address.toLowerCase()}` : null
  );

  return data ?? null;
};

export const useCurrentRoundData = () => {
  const { data } = useSWR<CurrentRoundInfo>(`/current-round`, {
    refreshInterval: 10000,
  });

  return data ?? null;
};

/**
 * TEMPORARY stopgap: on-chain tally for a poll the subgraph hasn't indexed yet.
 * Remove together with `constants/manualPolls` once indexing recovers.
 */
export const useManualPollTally = (id: string | undefined | null) => {
  const { data } = useSWR<PollTally>(
    id && isManualPoll(id) ? `/polls/tally/${id.toLowerCase()}` : null,
    // Matches the endpoint's cache window — polling faster just re-reads the
    // same cached object.
    { refreshInterval: 60000 }
  );

  return data ?? null;
};

export const usePendingFeesAndStakeData = (
  address: string | undefined | null
) => {
  const { data } = useSWR<PendingFeesAndStake>(
    address ? `/pending-stake/${address.toLowerCase()}` : null
  );

  return data ?? null;
};

export const useTreasuryVotingPowerData = (
  address: string | undefined | null
) => {
  const { data } = useSWR<VotingPower>(
    address ? `/treasury/votes/${address.toLowerCase()}` : null
  );

  return data ?? null;
};

export const useTreasuryRegisteredToVoteData = (
  address: string | undefined | null
) => {
  const { data } = useSWR<RegisteredToVote>(
    address ? `/treasury/votes/${address.toLowerCase()}/registered` : null
  );

  return data ?? null;
};

export const useTreasuryProposalState = (id: string | undefined) => {
  return useSWR<ProposalState>(id ? `/treasury/proposal/${id}/state` : null);
};

export const useProposalVotingPowerData = (
  id: string | undefined,
  address: Address | undefined | null
) => {
  const { data } = useSWR<ProposalVotingPower>(
    id && address
      ? `/treasury/proposal/${id}/votes/${address.toLowerCase()}`
      : null
  );
  return data ?? null;
};

export const useAccountBalanceData = (address: string | undefined | null) => {
  const { data } = useSWR<AccountBalance>(
    address ? `/account-balance/${address.toLowerCase()}` : null
  );

  return data ?? null;
};

export const useUnbondingLocksData = (
  address: string | undefined | null,
  from: number
) => {
  // `from` skips the ids the subgraph already has. See /api/unbonding-locks.
  const { data } = useSWR<UnbondingLocks>(
    address ? `/unbonding-locks/${address.toLowerCase()}?from=${from}` : null
  );

  return data ?? null;
};

export const useL1DelegatorData = (address: string | undefined | null) => {
  const { data } = useSWR<L1Delegator>(
    address ? `/l1-delegator/${address.toLowerCase()}` : null
  );

  return data ?? null;
};

export const useContractInfoData = (
  shouldFetch: boolean = true
): ContractInfo => {
  const { data } = useSWR<ContractInfo>(shouldFetch ? `/contracts` : null);

  return (
    data ?? {
      Controller: null,

      L1Migrator: null,
      L2Migrator: null,
      PollCreator: null,

      BondingManager: null,
      LivepeerToken: null,
      LivepeerTokenFaucet: null,
      MerkleSnapshot: null,
      Minter: null,
      RoundsManager: null,
      ServiceRegistry: null,
      TicketBroker: null,
      LivepeerGovernor: null,
      Treasury: null,
      BondingVotes: null,
    }
  );
};
