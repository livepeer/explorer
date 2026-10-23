"use client";

import { useQuery } from "@tanstack/react-query";
import { createPublicClient, http, isAddress, isAddressEqual } from "viem";
import { normalize } from "viem/ens";

import { L1_CHAIN, RPC_URLS } from "@/lib/config";

/**
 * Resolve an ENS name through each configured Ethereum RPC on its own and
 * accept the answer only when at least two answer and all agree. A name can
 * become a transfer recipient, so one lying or stale RPC mustn't decide it.
 */
export async function resolveEnsQuorum(
  name: string,
  urls: string[] = RPC_URLS[L1_CHAIN.id]
): Promise<{ address: string | null; disagree: boolean }> {
  const answers = await Promise.allSettled(
    urls.map((url) =>
      createPublicClient({
        chain: L1_CHAIN,
        transport: http(url, { timeout: 8_000, retryCount: 0 }),
      }).getEnsAddress({ name })
    )
  );
  return agreedAddress(answers);
}

/** The address all answering RPCs agree on; at least two must answer. */
export function agreedAddress(
  answers: PromiseSettledResult<`0x${string}` | null>[]
): { address: string | null; disagree: boolean } {
  const ok = answers
    .filter(
      (a): a is PromiseFulfilledResult<`0x${string}` | null> =>
        a.status === "fulfilled"
    )
    .map((a) => a.value);
  if (ok.length < 2) return { address: null, disagree: false };
  const [first, ...rest] = ok;
  const agree = rest.every((a) =>
    a == null || first == null ? a === first : isAddressEqual(a, first)
  );
  if (!agree) return { address: null, disagree: true };
  return { address: first?.toLowerCase() ?? null, disagree: false };
}

/**
 * What someone typed into an address field: a 0x address, or an ENS name
 * resolved on L1 by agreeing RPCs. `address` is lowercase once known;
 * `invalid` only once there's nothing left to resolve; `disagree` when
 * the RPCs gave different answers, so the name can't be trusted.
 */
export function useAddressInput(value: string) {
  const trimmed = value.trim();
  let ens: string | undefined;
  try {
    ens = /\.[a-z]{2,}$/i.test(trimmed) ? normalize(trimmed) : undefined;
  } catch {
    ens = undefined;
  }
  const { data, isFetching } = useQuery({
    queryKey: ["ens-quorum", ens],
    queryFn: () => resolveEnsQuorum(ens!),
    enabled: Boolean(ens),
    retry: false,
    staleTime: 60_000,
  });
  const resolved = ens ? data?.address ?? undefined : undefined;
  const address = isAddress(trimmed) ? trimmed.toLowerCase() : resolved;
  const disagree = Boolean(ens && data?.disagree);
  const invalid = trimmed.length > 0 && !address && !isFetching;
  return { address, ens, resolved, resolving: isFetching, invalid, disagree };
}
