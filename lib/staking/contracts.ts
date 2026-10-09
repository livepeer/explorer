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
    query: { staleTime: Infinity },
  });
  return data as `0x${string}` | undefined;
}
