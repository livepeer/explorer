/** How far into a series to look for a settling-in period. */
const SETTLING_DAYS = 30;

/**
 * Index where a daily series settles: just after the last value, within its
 * first 30 days, that is unset or changes by more than 1% to the next day.
 * For data whose first days are an artefact rather than history, like LPT
 * supply on Arbitrum, which arrived in jumps during the February 2022
 * migration.
 */
export function settledFrom(values: number[]) {
  let start = 0;
  const end = Math.min(values.length - 1, SETTLING_DAYS);
  for (let i = 0; i < end; i++) {
    const v = values[i];
    if (!(v > 0) || Math.abs(values[i + 1] - v) / v > 0.01) start = i + 1;
  }
  return start;
}
