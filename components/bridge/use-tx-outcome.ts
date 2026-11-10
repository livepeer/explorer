"use client";

import { useState } from "react";
import type { Hex } from "viem";
import { useWaitForTransactionReceipt } from "wagmi";

import { sameTransaction, txOutcome } from "@/lib/bridge/outcome";

/**
 * A sent transaction's receipt and how it ended (see `txOutcome`): a
 * transaction the wallet cancelled or swapped for another is "abandoned",
 * so it's never reported as done.
 */
export function useTxOutcome(hash: Hex | undefined, chainId: number) {
  const [abandoned, setAbandoned] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const receipt = useWaitForTransactionReceipt({
    hash,
    chainId,
    onReplaced: ({ reason, replacedTransaction }) => {
      if (sameTransaction(reason)) return;
      const gone = replacedTransaction.hash.toLowerCase();
      setAbandoned((s) => new Set(s).add(gone));
    },
  });
  const outcome = txOutcome(
    hash,
    abandoned,
    receipt.isSuccess ? receipt.data : undefined
  );
  return {
    outcome,
    /** Sent and still waiting for how it ends. */
    waiting: Boolean(hash) && !outcome && receipt.isLoading,
  };
}
