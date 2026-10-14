"use client";

import { keccak256, toBytes } from "viem";
import { useReadContract } from "wagmi";

import { controller } from "@/lib/abis/Controller";
import { CONTRACTS, L2_CHAIN } from "@/lib/config";

/** Protocol contracts are resolved through the Controller registry. */
export function useProtocolContract(
  name:
    | "BondingManager"
    | "LivepeerToken"
    | "RoundsManager"
    | "LivepeerGovernor"
) {
  const { data } = useReadContract({
    address: CONTRACTS.controller,
    abi: controller,
    functionName: "getContract",
    args: [keccak256(toBytes(name))],
    chainId: L2_CHAIN.id,
    // Not forever: the registry can point a name at an upgraded contract,
    // and a tab left open shouldn't keep sending to the old one. Stale
    // after ten minutes, it's read again on the next mount or focus.
    query: { staleTime: 10 * 60_000 },
  });
  return data as `0x${string}` | undefined;
}
