"use client";

import { isAddress } from "viem";
import { normalize } from "viem/ens";
import { useEnsAddress } from "wagmi";

import { L1_CHAIN } from "@/lib/config";

/**
 * What someone typed into an address field: a 0x address, or an ENS name
 * resolved on L1. `address` is lowercase once known; `invalid` only once
 * there's nothing left to resolve.
 */
export function useAddressInput(value: string) {
  const trimmed = value.trim();
  let ens: string | undefined;
  try {
    ens = /\.[a-z]{2,}$/i.test(trimmed) ? normalize(trimmed) : undefined;
  } catch {
    ens = undefined;
  }
  const { data: resolved, isFetching } = useEnsAddress({
    name: ens,
    chainId: L1_CHAIN.id,
    query: { enabled: Boolean(ens), retry: false },
  });
  const address = isAddress(trimmed)
    ? trimmed.toLowerCase()
    : resolved?.toLowerCase();
  const invalid = trimmed.length > 0 && !address && !isFetching;
  return { address, ens, resolved, resolving: isFetching, invalid };
}
