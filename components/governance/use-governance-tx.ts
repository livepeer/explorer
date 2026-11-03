"use client";

import { useState } from "react";
import {
  useAccount,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
  type UseWriteContractReturnType,
} from "wagmi";

import { L2_CHAIN } from "@/lib/config";
import { useIsSafe } from "@/lib/hooks/safe";
import { REVERTED } from "@/lib/tx";

export function txErrorMessage(e: unknown) {
  const msg =
    e instanceof Error
      ? (e as { shortMessage?: string }).shortMessage ?? e.message
      : String(e);
  if (/user rejected|denied/i.test(msg)) return "Request rejected in wallet";
  return msg.split("\n")[0];
}

/**
 * One governance transaction on Arbitrum: switch the wallet there if it's
 * on another network, sign, then wait for the receipt. A Safe returns a
 * proposal's hash instead, with no receipt to wait for, so it ends at
 * `proposed` (see SafeProposed).
 */
export function useGovernanceTx() {
  const isSafe = useIsSafe();
  const { chainId } = useAccount();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { writeContractAsync, isPending: writing } = useWriteContract();
  const signing = switching || writing;
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [error, setError] = useState<string | null>(null);
  const receipt = useWaitForTransactionReceipt({
    hash: isSafe ? undefined : hash,
    chainId: L2_CHAIN.id,
  });

  // A receipt only says the transaction was mined; its status says whether
  // it did anything.
  const reverted = receipt.isSuccess && receipt.data?.status === "reverted";

  const send = async (
    args: Parameters<UseWriteContractReturnType["writeContractAsync"]>[0]
  ) => {
    setError(null);
    try {
      // Otherwise wagmi refuses with a chain mismatch rather than ask.
      if (chainId !== L2_CHAIN.id) {
        await switchChainAsync({ chainId: L2_CHAIN.id });
      }
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
    error:
      error ??
      (reverted
        ? REVERTED
        : receipt.isError
        ? txErrorMessage(receipt.error)
        : null),
    setError,
    /** Waiting for the Safe check: don't send yet. */
    checking: isSafe === undefined,
    signing,
    confirming: !isSafe && Boolean(hash) && receipt.isLoading,
    confirmed: receipt.isSuccess && receipt.data?.status === "success",
    proposed: Boolean(isSafe && hash),
    block: receipt.data?.blockNumber,
  };
}
