import {
  encodeAbiParameters,
  encodeFunctionData,
  type Hex,
  parseEther,
  parseGwei,
  type PublicClient,
} from "viem";

import {
  ARB_INBOX,
  estimateRetryableTicketAbi,
  getOutboundCalldataAbi,
  inboxAbi,
  L1_LPT,
  L1_LPT_GATEWAY,
  L2_LPT_GATEWAY,
  NODE_INTERFACE,
} from "./config";

/**
 * What a deposit pays for its message on Arbitrum, sent as ETH with it:
 * a submission fee, and gas for the call that mints the LPT there. These
 * are maximums with headroom, like Arbitrum's own SDK, because prices can
 * move before the deposit lands; Arbitrum refunds what isn't used. Too
 * little gas doesn't lose the LPT, but it stops the deposit arriving on
 * its own, so it's better to over-provision a few cents.
 */
export type DepositParams = {
  maxGas: bigint;
  gasPriceBid: bigint;
  maxSubmissionCost: bigint;
  /** ETH to send with the deposit. */
  value: bigint;
  /** abi.encode(maxSubmissionCost, extraData) for outboundTransfer. */
  data: Hex;
};

/** No deposit should need more than this; anything above is a pricing bug. */
export const MAX_DEPOSIT_VALUE = parseEther("0.01");

/**
 * The headroom: 30% more gas than estimated (and at least 100k, the
 * floor Arbitrum's bridge uses), 3× today's Arbitrum gas price, and a
 * submission fee priced at 4× Ethereum's base fee, or 5 gwei if higher.
 * The submission fee is checked against the base fee of the block the
 * deposit lands in, so a spike past it would revert the deposit on
 * Ethereum (costing gas, not LPT).
 */
export function withHeadroom({
  gas,
  l2GasPrice,
  submissionFee,
}: {
  gas: bigint;
  l2GasPrice: bigint;
  submissionFee: bigint;
}): DepositParams {
  const minGas = 100_000n;
  const maxGas = (gas * 13n) / 10n > minGas ? (gas * 13n) / 10n : minGas;
  const gasPriceBid = l2GasPrice * 3n;
  const maxSubmissionCost = submissionFee;
  return {
    maxGas,
    gasPriceBid,
    maxSubmissionCost,
    value: maxSubmissionCost + maxGas * gasPriceBid,
    data: encodeAbiParameters(
      [{ type: "uint256" }, { type: "bytes" }],
      [maxSubmissionCost, "0x"]
    ),
  };
}

/** The base fee to price the submission fee at: 4× now, at least 5 gwei. */
export function submissionBaseFee(baseFee: bigint) {
  const floor = parseGwei("5");
  return baseFee * 4n > floor ? baseFee * 4n : floor;
}

/** Prices a deposit of `amount` LPT from `from` to `to` on Arbitrum. */
export async function priceDeposit(
  l1: PublicClient,
  l2: PublicClient,
  { from, to, amount }: { from: Hex; to: Hex; amount: bigint }
): Promise<DepositParams> {
  // The exact call the deposit will make on Arbitrum.
  const call = await l1.readContract({
    address: L1_LPT_GATEWAY,
    abi: getOutboundCalldataAbi,
    functionName: "getOutboundCalldata",
    args: [L1_LPT, from, to, amount, "0x"],
  });
  const [gas, l2GasPrice, block] = await Promise.all([
    // NodeInterface aliases the sender itself, so it's the plain gateway.
    l2.estimateGas({
      to: NODE_INTERFACE,
      data: encodeFunctionData({
        abi: estimateRetryableTicketAbi,
        functionName: "estimateRetryableTicket",
        args: [
          L1_LPT_GATEWAY,
          parseEther("1"),
          L2_LPT_GATEWAY,
          0n,
          to,
          to,
          call,
        ],
      }),
    }),
    l2.getGasPrice(),
    l1.getBlock(),
  ]);
  const submissionFee = await l1.readContract({
    address: ARB_INBOX,
    abi: inboxAbi,
    functionName: "calculateRetryableSubmissionFee",
    args: [
      BigInt((call.length - 2) / 2),
      submissionBaseFee(block.baseFeePerGas ?? 0n),
    ],
  });
  const params = withHeadroom({ gas, l2GasPrice, submissionFee });
  if (params.value > MAX_DEPOSIT_VALUE) {
    throw new Error(
      "Arbitrum's fees look unusually high right now. Try again in a bit."
    );
  }
  return params;
}

/* ── Deposits on their way ──────────────────────────────────────────────── */

/**
 * A deposit sent from here, kept in this browser until it arrives on
 * Arbitrum (usually 10–15 minutes), so it shows across reloads.
 */
export type PendingDeposit = {
  l1Tx: Hex;
  from: string;
  to: string;
  /** In wei. */
  amount: string;
  /** Unix seconds. */
  sentAt: number;
};

const KEY = "livepeer-explorer.bridge-deposits";
const listeners = new Set<() => void>();

export function readPendingDeposits(): PendingDeposit[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function write(list: PendingDeposit[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private mode: it just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

export function addPendingDeposit(d: PendingDeposit) {
  write([...readPendingDeposits().filter((x) => x.l1Tx !== d.l1Tx), d]);
}

export function removePendingDeposits(l1Txs: string[]) {
  write(readPendingDeposits().filter((x) => !l1Txs.includes(x.l1Tx)));
}

export function subscribePendingDeposits(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}
