/**
 * Whether an orchestrator is in the active set in `round`, by the contract's
 * rule: activated at or before it and not yet deactivated. The subgraph's
 * stored `active` flag can go stale, so derive it from the rounds instead.
 * Round numbers stay strings: an orchestrator that was never deactivated has
 * a deactivation round far past `Number.MAX_SAFE_INTEGER`.
 */
export function isActiveInRound(
  activationRound: string | number | null | undefined,
  deactivationRound: string | number | null | undefined,
  round: number
): boolean {
  if (activationRound == null || deactivationRound == null) return false;
  const r = BigInt(round);
  return BigInt(activationRound) <= r && r < BigInt(deactivationRound);
}
