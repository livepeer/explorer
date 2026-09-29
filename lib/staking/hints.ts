import { zeroAddress } from "viem";

/**
 * BondingManager keeps the active set in a doubly linked list sorted by
 * stake (descending). Every stake-changing call takes the node's new
 * neighbours as hints; wrong or empty hints still succeed but fall back to a
 * linear walk that costs far more gas. We simulate the post-transaction order
 * locally and hand over the neighbours.
 */

export type Hint = { prev: `0x${string}`; next: `0x${string}` };

export const EMPTY_HINT: Hint = { prev: zeroAddress, next: zeroAddress };

export function simulateHint(
  activeSet: { id: string; stake: number }[],
  target: string,
  deltas: Record<string, number>
): Hint {
  const t = target.toLowerCase();
  const next = activeSet
    .map((o) => ({
      id: o.id.toLowerCase(),
      stake: o.stake + (deltas[o.id.toLowerCase()] ?? 0),
    }))
    .sort((a, b) => b.stake - a.stake);
  const i = next.findIndex((o) => o.id === t);
  if (i < 0 || next.length < 2) return EMPTY_HINT;
  return {
    prev: (i > 0 ? next[i - 1].id : zeroAddress) as `0x${string}`,
    next: (i < next.length - 1 ? next[i + 1].id : zeroAddress) as `0x${string}`,
  };
}

/** Hints for bondWithHint: old delegate loses `moved`, new one gains `amount + moved`. */
export function bondHints(
  activeSet: { id: string; stake: number }[],
  {
    to,
    from,
    amount,
    moved,
  }: { to: string; from?: string | null; amount: number; moved: number }
) {
  const deltas: Record<string, number> = {};
  const toL = to.toLowerCase();
  const fromL = from?.toLowerCase();
  const switching = fromL && fromL !== toL && fromL !== zeroAddress;
  deltas[toL] = amount + (switching ? moved : 0);
  if (switching) deltas[fromL] = -moved;
  return {
    oldDelegate: switching
      ? simulateHint(activeSet, fromL, deltas)
      : EMPTY_HINT,
    newDelegate: simulateHint(activeSet, toL, deltas),
  };
}
