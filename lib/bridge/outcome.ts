/**
 * How a sent transaction ended. A wallet can replace a pending transaction
 * with another at the same nonce. A fee bump ("repriced") is still the same
 * transaction, but a cancellation or a different transaction isn't, even
 * when that one succeeds: it's "abandoned", never "success".
 */
export type TxOutcome = "success" | "reverted" | "abandoned";

export function txOutcome(
  hash: string | undefined,
  abandoned: ReadonlySet<string>,
  receipt: { status: "success" | "reverted" } | undefined
): TxOutcome | undefined {
  if (!hash) return undefined;
  if (abandoned.has(hash.toLowerCase())) return "abandoned";
  return receipt?.status;
}

/** Whether a replacement still counts as the transaction it replaced. */
export const sameTransaction = (reason: string) => reason === "repriced";
