import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { capitalCase } from "change-case";
import { useEffect } from "react";

import {
  InputData,
  TransactionIdentifier,
  useExplorerStore,
} from "./useExplorerStore";

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

  useEffect(() => {
    if (isLoading) {
      setLatestTransactionSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  useEffect(() => {
    if (data) {
      addRecentTransaction({
        hash: data,
        description: capitalCase(id),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

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
