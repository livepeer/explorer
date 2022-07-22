import { GetChangefeed } from "@lib/api/types/get-changefeed";
import { HomeChartData } from "@lib/api/types/get-chart-data";
import { EnsIdentity } from "@lib/api/types/get-ens";
import useSWR from "swr";

export const useEnsData = (address: string | undefined | null) => {
  const { data } = useSWR<EnsIdentity>(address ? `/ens-data/${address.toLowerCase()}` : null);

  return data ?? null;
};

export const useChartData = () => {
  const { data } = useSWR<HomeChartData>(`/usage`);

  return data ?? null;
};

export const useChangefeedData = () => {
  const { data } = useSWR<GetChangefeed>(`/changefeed`);

  return data ?? null;
};
