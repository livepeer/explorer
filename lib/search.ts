/**
 * Rank for a name-or-address search: 0 when the ENS name starts with the
 * query, 1 when it or the address contains it, null when neither does.
 */
export function searchRank(
  address: string,
  name: string | undefined,
  q: string
): number | null {
  if (!q) return 1;
  if (name?.startsWith(q)) return 0;
  if (name?.includes(q) || address.includes(q)) return 1;
  return null;
}
