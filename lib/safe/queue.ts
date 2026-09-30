import { getAddress, type Hex } from "viem";

import {
  describeProposal,
  type LivepeerContracts,
  type ProposalAction,
} from "./proposals";

/**
 * Safe's Client Gateway, the public API behind the Safe{Wallet} app. It
 * answers for any address; one that isn't a Safe gets a 404.
 */
const GATEWAY = "https://safe-client.safe.global/v1/chains/42161";

export type SafeProposal = {
  /** Safe's transaction id, for linking to it in Safe{Wallet}. */
  id: string;
  safe: string;
  nonce: number;
  confirmations: number;
  required: number;
  actions: ProposalAction[];
};

type QueueItem = {
  type: string;
  transaction?: {
    id: string;
    executionInfo?: {
      nonce: number;
      confirmationsRequired: number;
      confirmationsSubmitted: number;
    };
  };
};

type TxDetails = {
  txData?: { hexData?: Hex | null; to?: { value: string } } | null;
};

/** How many queued transactions to inspect per Safe. */
const LIMIT = 10;

async function get<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  const res = await fetch(`${GATEWAY}${path}`, { signal });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/**
 * A Safe's queued transactions that are Livepeer actions. Empty for an
 * address that isn't a Safe, or when the gateway can't be reached: this
 * is extra context, never something the portfolio depends on.
 */
export async function fetchSafeProposals(
  address: string,
  contracts: LivepeerContracts,
  signal?: AbortSignal
): Promise<SafeProposal[]> {
  const safe = getAddress(address);
  try {
    const queue = await get<{ results: QueueItem[] }>(
      `/safes/${safe}/transactions/queued`,
      signal
    );
    const txs = (queue?.results ?? [])
      .filter((r) => r.type === "TRANSACTION" && r.transaction?.executionInfo)
      .slice(0, LIMIT)
      .map((r) => r.transaction!);
    const out = await Promise.all(
      txs.map(async (t): Promise<SafeProposal | null> => {
        const details = await get<TxDetails>(
          `/transactions/${encodeURIComponent(t.id)}`,
          signal
        );
        const to = details?.txData?.to?.value;
        const data = details?.txData?.hexData;
        if (!to || !data) return null;
        const actions = describeProposal({ to, data }, contracts);
        if (!actions.length) return null;
        const info = t.executionInfo!;
        return {
          id: t.id,
          safe: safe.toLowerCase(),
          nonce: info.nonce,
          confirmations: info.confirmationsSubmitted,
          required: info.confirmationsRequired,
          actions,
        };
      })
    );
    return out.filter((p): p is SafeProposal => p != null);
  } catch (e) {
    if (signal?.aborted) throw e;
    return [];
  }
}

/** Opens one queued transaction in Safe{Wallet}. */
export const safeTxUrl = (safe: string, id: string) =>
  `https://app.safe.global/transactions/tx?safe=arb1:${getAddress(
    safe
  )}&id=${encodeURIComponent(id)}`;
