import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { capitalCase } from "change-case";
import { useEffect } from "react";
import { TransactionIdentifier, useExplorerStore } from "./useExplorerStore";

export const useHandleTransaction = (
  id: TransactionIdentifier,
  data: `0x${string}` | undefined,
  error: Error | null,
  isLoading: boolean,
  isSuccess: boolean,
  args: any,
  onSuccess?: ((result: `0x${string}`) => Promise<void> | void) | null
) => {
  const {
    setLatestTransactionError,
    setLatestTransactionSummary,
    setLatestTransactionConfirmed,
    setLatestTransactionDetails,
  } = useExplorerStore();
  const addRecentTransaction = useAddRecentTransaction();

  useEffect(() => {
    if (isLoading) {
      setLatestTransactionSummary();
    }
  }, [isLoading]);

  useEffect(() => {
    if (data) {
      addRecentTransaction({
        hash: data,
        description: capitalCase(id),
      });
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setLatestTransactionDetails(data, id, args);

      if (onSuccess) {
        onSuccess(data);
      }
    }
  }, [data]);

  useEffect(() => {
    if (isSuccess) {
      setLatestTransactionConfirmed();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      console.error(error);
      setLatestTransactionError(error.message.replace("GraphQL error: ", ""));
    }
  }, [error]);
};
