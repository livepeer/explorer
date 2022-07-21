import { EnsIdentity } from "@api/types/get-ens";
import useSWR from "swr";

export const useEnsData = (address: string | undefined | null) => {
  const { data } = useSWR<EnsIdentity>(
    address ? `/ens/${address}` : null
  );

  return data ?? null;
};

export const useChartData = (address: string | undefined | null) => {
  const { data } = useSWR<EnsIdentity>(
    address ? `/ens/${address}` : null
  );

  return data ?? null;
};
