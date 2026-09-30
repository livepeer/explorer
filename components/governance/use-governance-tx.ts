"use client";

import { useState } from "react";
import {
  useWaitForTransactionReceipt,
  useWriteContract,
  type UseWriteContractReturnType,
} from "wagmi";

import { L2_CHAIN } from "@/lib/config";
import { useIsSafe } from "@/lib/hooks/safe";

export function txErrorMessage(e: unknown) {
  const msg =
    e instanceof Error
      ? (e as { shortMessage?: string }).shortMessage ?? e.message
      : String(e);
  if (/user rejected|denied/i.test(msg)) return "Request rejected in wallet";
  return msg.split("\n")[0];
}

/**
 * One governance transaction on Arbitrum: sign, then wait for the receipt.
 * A Safe returns a proposal's hash instead, with no receipt to wait for, so
 * it ends at `proposed` (see SafeProposed).
 */
export function useGovernanceTx() {
  const isSafe = useIsSafe();
  const { writeContractAsync, isPending: signing } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const receipt = useWaitForTransactionReceipt({
    hash: isSafe ? undefined : hash,
    chainId: L2_CHAIN.id,
  });

  const send = async (
    args: Parameters<UseWriteContractReturnType["writeContractAsync"]>[0]
  ) => {
    setError(null);
    try {
      const h = await writeContractAsync({ ...args, chainId: L2_CHAIN.id });
      setHash(h);
      return h;
    } catch (e) {
      setError(txErrorMessage(e));
      return undefined;
    }
  };

  return {
    send,
    hash,
    error: error ?? (receipt.isError ? txErrorMessage(receipt.error) : null),
    setError,
    /** Waiting for the Safe check: don't send yet. */
    checking: isSafe === undefined,
    signing,
    confirming: !isSafe && Boolean(hash) && receipt.isLoading,
    confirmed: receipt.isSuccess,
    proposed: Boolean(isSafe && hash),
    block: receipt.data?.blockNumber,
  };
}
