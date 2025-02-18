import { AccountBalance } from "@lib/api/types/get-account-balance";
import { GetChangefeed } from "@lib/api/types/get-changefeed";
import { HomeChartData } from "@lib/api/types/get-chart-data";
import { ContractInfo } from "@lib/api/types/get-contract-info";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { L1Delegator } from "@lib/api/types/get-l1-delegator";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import { AllPerformanceMetrics, PerformanceMetrics } from "@lib/api/types/get-performance";
import { AvailablePipelines, Pipeline } from "@lib/api/types/get-available-pipelines";
import { Regions } from "@lib/api/types/get-regions";
import {
  ProposalVotingPower,
  RegisteredToVote,
  VotingPower,
} from "@lib/api/types/get-treasury-proposal";
import useSWR from "swr";
import { Address } from "viem";
import { type ProposalState } from "@lib/api/types/get-treasury-proposal";

export const useRegionsData = (): Regions => {
  const { data } = useSWR<Regions>(`/regions`);

  return data ?? { regions: [{id:"GLOBAL", name:"Global", type: "transcoding"}] };
};

export const useEnsData = (address: string | undefined | null): EnsIdentity => {
  const { data } = useSWR<EnsIdentity>(
    address ? `/ens-data/${address.toLowerCase()}` : null
  );

  return (
    data ?? {
      id: address ?? "",
      idShort: address?.replace(address?.slice(6, 38), "…") ?? "",
      name: null,
    }
  );
};

export const useAllEnsData = (): EnsIdentity[] => {
  const { data } = useSWR<EnsIdentity[]>(`/ens-data`);

  return data ?? [];
};

export const useChartData = () => {
  const { data } = useSWR<HomeChartData>(`/usage`);

  return data ?? null;
};

export const useChangefeedData = () => {
  const { data } = useSWR<GetChangefeed>(`/changefeed`);

  return data ?? null;
};

export const useAvailableInferencePipelinesData = () => {
  const { data, isValidating } = useSWR<AvailablePipelines>(`/pipelines`);
  return { data: data ?? {pipelines: []}, isValidating };
};

export const useAllScoreData = (pipeline: Pipeline["id"] | null, model: string | null) => {
  const url = pipeline && model
    ? `/score?pipeline=${encodeURIComponent(pipeline)}&model=${encodeURIComponent(model)}`
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
  const { data } = useSWR<AccountBalance>(address ? `/account-balance/${address.toLowerCase()}` : null);

  return data ?? null;
};

export const useL1DelegatorData = (address: string | undefined | null) => {
  const { data } = useSWR<L1Delegator>(address ? `/l1-delegator/${address.toLowerCase()}` : null);

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
