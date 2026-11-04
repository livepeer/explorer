import { formatEther } from "viem";

import { parseAmountToWei } from "./web3";

/** Format every supplied decimal digit without passing the amount through Number. */
export function formatFullLPT(
  value: string | number | null | undefined,
  { forceSign = false }: { forceSign?: boolean } = {}
): string | null {
  if (value == null) return null;
  const match = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?$/.exec(
    String(value).trim()
  );
  if (!match) return null;

  const [, sign, coefficient, exponentString = "0"] = match;
  const exponent = Number(exponentString);
  // Bound expansion of malformed input. Only the exponent uses Number.
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 1000) return null;
  const [whole, fraction = ""] = coefficient.split(".");
  const digits = whole + fraction;
  const point = whole.length + exponent;
  const expanded =
    point <= 0
      ? `0.${"0".repeat(-point)}${digits}`
      : point >= digits.length
      ? digits + "0".repeat(point - digits.length)
      : `${digits.slice(0, point)}.${digits.slice(point)}`;
  const [integer, decimal = ""] = expanded.split(".");
  const normalizedInteger = integer.replace(/^0+(?=\d)/, "");
  const normalizedDecimal = decimal.replace(/0+$/, "");
  const isZero = normalizedInteger === "0" && !normalizedDecimal;
  const prefix = isZero ? "" : sign === "-" ? "-" : forceSign ? "+" : "";
  const grouped = normalizedInteger.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${prefix}${grouped}${
    normalizedDecimal ? `.${normalizedDecimal}` : ""
  } LPT`;
}

/** Pending stake is in wei; subgraph principal/unbonded amounts are in LPT. */
export function getLptRewards(
  pendingStakeWei: string | null | undefined,
  principal: string | null | undefined,
  unbonded = "0"
): string | null {
  if (
    pendingStakeWei == null ||
    !/^\d+$/.test(pendingStakeWei) ||
    principal == null
  )
    return null;
  const principalWei = parseAmountToWei(principal);
  const unbondedWei = parseAmountToWei(unbonded);
  if (principalWei == null || unbondedWei == null) return null;
  const abs = (value: bigint) => (value < 0n ? -value : value);
  return formatEther(
    BigInt(pendingStakeWei) + abs(unbondedWei) - abs(principalWei)
  );
}
