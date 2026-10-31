"use client";

import { keccak256, toBytes } from "viem";
import { useReadContract } from "wagmi";

import { controller } from "@/lib/abis/Controller";
import { CONTRACTS, L2_CHAIN, type ProtocolContractName } from "@/lib/config";

import { confirmedContract } from "./confirm";

/**
 * A protocol contract's address, for reading or sending to. It's the pinned
 * address in PROTOCOL_CONTRACTS, returned only once the Controller registry
 * on Arbitrum agrees with it. If the registry says otherwise (an RPC lying,
 * or a real change the Explorer hasn't been updated for), nothing is
 * returned, so no transaction can be built against an unexpected contract.
 */
export function useProtocolContract(name: ProtocolContractName) {
  const { data } = useReadContract({
    address: CONTRACTS.controller,
    abi: controller,
    functionName: "getContract",
    args: [keccak256(toBytes(name))],
    chainId: L2_CHAIN.id,
    // Re-checked every ten minutes, on the next mount or focus.
    query: { staleTime: 10 * 60_000 },
  });
  return confirmedContract(name, data as string | undefined);
}
