import { AccountBalance } from "@lib/api/types/get-account-balance";
import { GetChangefeed } from "@lib/api/types/get-changefeed";
import { HomeChartData } from "@lib/api/types/get-chart-data";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { EnsIdentity } from "@lib/api/types/get-ens";
import { L1Delegator } from "@lib/api/types/get-l1-delegator";
import { PendingFeesAndStake } from "@lib/api/types/get-pending-stake";
import {
  AllPerformanceMetrics,
  PerformanceMetrics,
} from "@lib/api/types/get-performance";
import { useMemo } from "react";
import useSWR from "swr";

export const useEnsData = (address: string | undefined | null): EnsIdentity => {
  const { data: allEnsData } = useSWR<EnsIdentity[]>(`/ens-data`);
  const foundEns = useMemo(
    () => allEnsData?.find((e) => e.id.toLowerCase() === address.toLowerCase()),
    [address, allEnsData]
  );

  const { data } = useSWR<EnsIdentity>(
    foundEns || !allEnsData
      ? null
      : address
      ? `/ens-data/${address.toLowerCase()}`
      : null
  );

  return (
    foundEns ??
    data ?? {
      id: address,
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

export const useAllScoreData = () => {
  const { data } = useSWR<AllPerformanceMetrics>(`/score`);

  return data ?? null;
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

export const useAccountBalanceData = (address: string | undefined | null) => {
  const { data } = useSWR<AccountBalance>(
    address ? `/account-balance/${address.toLowerCase()}` : null
  );

  return data ?? null;
};

export const useL1DelegatorData = (address: string | undefined | null) => {
  const { data } = useSWR<L1Delegator>(
    address ? `/l1-delegator/${address.toLowerCase()}` : null
  );

  return data ?? null;
};
