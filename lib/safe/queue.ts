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
    /** "Custom" is a contract call or batch; transfers, settings changes
     * and rejections have their own types and can't be Livepeer actions. */
    txInfo?: { type: string; isCancellation?: boolean };
    executionInfo?: {
      nonce: number;
      confirmationsRequired: number;
      confirmationsSubmitted: number;
    };
  };
};

type TxDetails = {
  txData?: {
    hexData?: Hex | null;
    to?: { value: string };
    operation?: number;
  } | null;
};

type QueuePage = { next?: string | null; results: QueueItem[] };

/** A guard against a runaway queue, far past any real Safe's. */
const MAX_PAGES = 25;
/** Transaction details fetched at once. */
const CONCURRENCY = 5;

async function get<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  return getUrl(`${GATEWAY}${path}`, signal);
}

async function getUrl<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  // Only ever follow the gateway's own links.
  if (!url.startsWith(`${GATEWAY}/`)) return null;
  const res = await fetch(url, { signal });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** Run `fn` over `items`, at most `n` at a time, keeping order. */
async function mapLimit<T, R>(
  items: T[],
  n: number,
  fn: (t: T) => Promise<R>
): Promise<R[]> {
  const out: R[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
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
    // The whole queue, page by page: a Livepeer action can sit behind any
    // number of unrelated transactions.
    const items: QueueItem[] = [];
    let page = await get<QueuePage>(
      `/safes/${safe}/transactions/queued`,
      signal
    );
    for (let i = 1; page; i++) {
      items.push(...page.results);
      if (!page.next || i >= MAX_PAGES) break;
      page = await getUrl<QueuePage>(page.next, signal);
    }
    // Only contract calls can be Livepeer actions, so only they're opened.
    const txs = items
      .filter(
        (r) =>
          r.type === "TRANSACTION" &&
          r.transaction?.executionInfo &&
          r.transaction.txInfo?.type === "Custom" &&
          !r.transaction.txInfo.isCancellation
      )
      .map((r) => r.transaction!);
    const out = await mapLimit(
      txs,
      CONCURRENCY,
      async (t): Promise<SafeProposal | null> => {
        const details = await get<TxDetails>(
          `/transactions/${encodeURIComponent(t.id)}`,
          signal
        );
        const to = details?.txData?.to?.value;
        const data = details?.txData?.hexData;
        const operation = details?.txData?.operation;
        if (!to || !data || (operation !== 0 && operation !== 1)) return null;
        const actions = describeProposal({ to, data, operation }, contracts);
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
      }
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
