"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useReadContracts } from "wagmi";

import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { L1_CHAIN } from "@/lib/config";
import { fromWei } from "@/lib/format";

import { L1_LPT } from "./config";
import type { BridgeWithdrawal } from "./types";

/** Unclaimed LPT withdrawals to Ethereum sent from or to these addresses. */
export function useBridgeWithdrawals(addresses: string[]) {
  const key = [...addresses].map((a) => a.toLowerCase()).sort();
  return useQuery({
    queryKey: ["bridge-withdrawals", key],
    enabled: key.length > 0 && key.length <= 20,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const res = await fetch(`/api/bridge/withdrawals?address=${key}`);
      if (!res.ok) throw new Error("Couldn't check bridge withdrawals");
      const { withdrawals } = (await res.json()) as {
        withdrawals: BridgeWithdrawal[];
      };
      return withdrawals;
    },
  });
}

/** Below this, LPT on Ethereum is dust rather than something to bridge. */
const L1_DUST = 0.01;

/** LPT each address holds on Ethereum, where it can't be delegated. */
export function useL1Lpt(addresses: string[]) {
  const { data } = useReadContracts({
    contracts: addresses.map((a) => ({
      address: L1_LPT as `0x${string}`,
      abi: livepeerToken,
      functionName: "balanceOf",
      args: [a as `0x${string}`],
      chainId: L1_CHAIN.id,
    })),
    query: { enabled: addresses.length > 0, staleTime: 60_000 },
  });
  return useMemo(() => {
    const out = new Map<string, number>();
    data?.forEach((r, i) => {
      if (r.status !== "success") return;
      const lpt = fromWei(r.result as bigint);
      if (lpt >= L1_DUST) out.set(addresses[i], lpt);
    });
    return out;
  }, [data, addresses]);
}
