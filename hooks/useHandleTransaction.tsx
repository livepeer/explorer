import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { capitalCase } from "change-case";
import { useEffect, useRef } from "react";
import { isHash } from "viem";

import {
  InputData,
  TransactionIdentifier,
  useExplorerStore,
} from "./useExplorerStore";
import { useIsSafe } from "./wallet";

export const useHandleTransaction = (
  id: TransactionIdentifier,
  data: `0x${string}` | undefined,
  error: Error | null,
  isLoading: boolean,
  isSuccess: boolean,
  args: InputData,
  onSuccess?: ((result: `0x${string}`) => Promise<void> | void) | null
) => {
  const {
    setLatestTransactionError,
    setLatestTransactionSummary,
    setLatestTransactionConfirmed,
    setLatestTransactionDetails,
  } = useExplorerStore();
  const addRecentTransaction = useAddRecentTransaction();
  const isSafe = useIsSafe();
  const trackedHash = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) {
      setLatestTransactionSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  // Safes return a Safe tx hash (or a non-hash value) instead of an on-chain
  // tx hash, which RainbowKit would track forever or throw on.
  useEffect(() => {
    if (
      data &&
      isHash(data) &&
      isSafe === false &&
      trackedHash.current !== data
    ) {
      addRecentTransaction({
        hash: data,
        description: capitalCase(id),
      });
      trackedHash.current = data;
    }
  }, [data, isSafe, addRecentTransaction, id]);

  useEffect(() => {
    if (data) {
      setLatestTransactionDetails(data, id, args);

      if (onSuccess) {
        onSuccess(data);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (isSuccess) {
      setLatestTransactionConfirmed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error(error);
      setLatestTransactionError(error.message.replace("GraphQL error: ", ""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);
};
