import { trackTransaction } from "@lib/analytics";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { capitalCase } from "change-case";
import { useCallback, useEffect, useRef } from "react";
import { Hash, isHash } from "viem";
import { useConfig } from "wagmi";

import {
  InputData,
  TransactionIdentifier,
  useExplorerStore,
} from "./useExplorerStore";
import { useIsSafe } from "./wallet";

/** Handle a submission even if its form unmounts while the wallet is open. */
export const useSubmitTransaction = (id: TransactionIdentifier) => {
  const {
    setLatestTransactionSummary,
    setLatestTransactionDetails,
    setLatestTransactionConfirmed,
    setLatestTransactionError,
  } = useExplorerStore();
  const config = useConfig();
  const addRecentTransaction = useAddRecentTransaction();
  const isSafe = useIsSafe();
  const safeStatus = useRef(isSafe);
  const pendingTracking = useRef<Array<{ hash: Hash; args: InputData }>>([]);

  const trackSubmission = useCallback(
    (hash: Hash, args: InputData) => {
      if (!isHash(hash)) return;
      if (safeStatus.current === undefined) {
        pendingTracking.current.push({ hash, args });
      } else if (!safeStatus.current) {
        addRecentTransaction({ hash, description: capitalCase(id) });
        trackTransaction(config, id, args, hash);
      }
    },
    [addRecentTransaction, config, id]
  );

  useEffect(() => {
    safeStatus.current = isSafe;
    if (isSafe === undefined) return;
    const pending = pendingTracking.current;
    pendingTracking.current = [];
    pending.forEach(({ hash, args }) => trackSubmission(hash, args));
  }, [isSafe, trackSubmission]);

  return async (write: () => Promise<Hash>, args: InputData) => {
    setLatestTransactionSummary();
    let hash: Hash;
    try {
      hash = await write();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      setLatestTransactionError(message.replace("GraphQL error: ", ""));
      return;
    }

    // These callbacks survive unmounting; effects watching mutation state do not.
    setLatestTransactionDetails(hash, id, args);
    setLatestTransactionConfirmed();
    trackSubmission(hash, args);
  };
};
