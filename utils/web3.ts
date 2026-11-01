import { ethers } from "ethers";
import { formatEther, getAddress, parseEther } from "viem";

/**
 * Ethereum Address Zero (0x0...0)
 */
export const EMPTY_ADDRESS = ethers.constants.AddressZero;

/**
 * Protocol multiplier for percentage values stored with 9 degrees of precision.
 * 1,000,000,000 = 100%
 */
export const PERCENTAGE_PRECISION_BILLION = 1000000000;

/**
 * Protocol multiplier for percentage values stored with 6 degrees of precision.
 * 1,000,000 = 100%
 */
export const PERCENTAGE_PRECISION_MILLION = 1000000;

/**
 * Protocol multiplier for percentage values stored with 4 degrees of precision (BIPS).
 * 10,000 = 100%
 */
export const PERCENTAGE_PRECISION_TEN_THOUSAND = 10000;

/**
 * Check if two addresses are equal, case-insensitive.
 * @param address1 - First address
 * @param address2 - Second address
 * @returns true if addresses match
 */
export const checkAddressEquality = (address1: string, address2: string) => {
  try {
    const formattedAddress1 = getAddress(address1.toLowerCase());
    const formattedAddress2 = getAddress(address2.toLowerCase());

    return formattedAddress1 === formattedAddress2;
  } catch {
    return false;
  }
};

/**
 * Convert Wei (bigint/string) to Ether string
 * Safely handles null/undefined by returning "0".
 * @param wei - The value in Wei
 * @returns String representation in Ether
 */
export const fromWei = (wei: bigint | string | null | undefined) => {
  if (wei == null) {
    return "0";
  }
  if (typeof wei === "string") {
    return formatEther(BigInt(wei));
  }
  return formatEther(wei);
};

/**
 * Convert Ether amount (number) to Wei (bigint).
 * @deprecated Use parseAmountToWei instead.
 * @param ether - The value in Ether
 * @returns BigInt representation in Wei
 */
export const toWei = (ether: number) => parseEther(ether.toString());

/**
 * Parse a user-entered amount into Wei.
 *
 * `parseEther` only accepts decimals, so exponent notation (e.g. `1e3`) is
 * normalised with string arithmetic to preserve precision.
 *
 * @param amount - The user-entered amount in Ether
 * @returns BigInt representation in Wei, or null when it cannot be parsed
 */
export const parseAmountToWei = (amount: string | null | undefined) => {
  if (!amount) return null;
  try {
    if (!/[eE]/.test(amount)) return parseEther(amount);

    const match = /^([+-]?)(\d+(?:\.\d*)?|\.\d+)[eE]([+-]?\d+)$/.exec(amount);
    if (!match) return null;
    const [, sign, coefficient, exponentString] = match;
    // Only the integer exponent uses Number. Bound expansion to avoid allocating
    // enormous strings from malformed input; token amounts need far fewer digits.
    const exponent = Number(exponentString);
    if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 1000)
      return null;

    const [whole, fraction = ""] = coefficient.split(".");
    const digits = whole + fraction;
    const decimalPoint = whole.length + exponent;
    const decimal =
      decimalPoint <= 0
        ? `0.${"0".repeat(-decimalPoint)}${digits}`
        : decimalPoint >= digits.length
        ? digits + "0".repeat(decimalPoint - digits.length)
        : `${digits.slice(0, decimalPoint)}.${digits.slice(decimalPoint)}`;

    return parseEther(`${sign === "-" ? "-" : ""}${decimal}`);
  } catch {
    return null;
  }
};

/**
 * Shorten an Ethereum address for display.
 * @deprecated Use formatAddress instead
 * @param address - The address to shorten.
 * @returns The shortened address.
 */
export const shortenAddress = (address: string) =>
  address?.replace(address.slice(5, 39), "…") ?? "";

/**
 * Format an address for display (shortens it).
 * Handles ENS names (.eth, .xyz) intelligently.
 * @param addr - The address or ENS name
 * @param startLength - Length of prefix to keep
 * @param endLength - Length of suffix to keep
 * @returns Formatted address string
 */
export const formatAddress = (
  addr: string | null | undefined,
  startLength = 6,
  endLength = 4
): string => {
  if (!addr) return "";
  if (addr.endsWith(".xyz")) {
    return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
  }
  if (addr.endsWith(".eth") && addr.length < 21) {
    return addr;
  }
  return addr.length > 21
    ? `${addr.slice(0, startLength)}…${addr.slice(-endLength)}`
    : addr;
};

/**
 * Format a transaction hash for display (shortens it).
 * @param id - The transaction hash
 * @returns Shortened hash
 */
export const formatTransactionHash = (id: string | null | undefined) => {
  if (!id) return "";
  return id.replace(id.slice(6, 62), "…");
};
