/**
 * Query options for on-chain reads inside an open transaction dialog or
 * form: values another app, tab or the protocol can change mid-flow
 * (allowance, balance, delegation, vote status).
 *
 * Cheap by design: reads made at the same moment go out as one multicall,
 * react-query pauses the interval while the tab is hidden, and it stops when
 * the dialog unmounts. Use it only for values that can change from outside;
 * constants keep their long cache.
 */
export const LIVE_READ = {
  refetchInterval: 5_000,
  refetchOnWindowFocus: true,
} as const;

/**
 * Re-read until a value reflects a transaction that just confirmed. The
 * node behind a read can lag the one that returned the receipt by a block
 * or two, so a single refetch can still see the old value. Resolves true
 * once `done` holds, false if it never did within the tries.
 */
export async function refetchUntil<T>(
  refetch: () => Promise<{ data?: T }>,
  done: (data: T | undefined) => boolean,
  { tries = 10, delayMs = 1_000 } = {}
): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    const { data } = await refetch();
    if (done(data)) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}
