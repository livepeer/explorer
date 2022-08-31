import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { capitalCase } from "change-case";
import { ContractTransaction } from "ethers";
import { useCallback } from "react";
import { TransactionIdentifier, useExplorerStore } from "./useExplorerStore";

export const useHandleTransaction = (
  id: TransactionIdentifier,
  onSuccess?: ((result: ContractTransaction) => Promise<void> | void) | null
) => {
  const {
    setLatestTransactionError,
    setLatestTransactionSummary,
    setLatestTransactionConfirmed,
    setLatestTransactionDetails,
  } = useExplorerStore();
  const addRecentTransaction = useAddRecentTransaction();

  return useCallback(
    async <T extends object>(
      transaction: () => Promise<ContractTransaction>,
      args: T
    ) => {
      try {
        setLatestTransactionSummary();

        const result = await transaction();

        addRecentTransaction({
          hash: result.hash,
          description: capitalCase(id),
        });

        setLatestTransactionDetails(result.hash, result.from, id, args);

        if (onSuccess) {
          await onSuccess(result);
        }

        const _awaitedResult = await result.wait();

        setLatestTransactionDetails(result.hash, result.from, id, args);
        setLatestTransactionConfirmed();
      } catch (e) {
        console.error(e);
        setLatestTransactionError(e.message.replace("GraphQL error: ", ""));
      }
    },
    [
      id,
      setLatestTransactionError,
      setLatestTransactionDetails,
      setLatestTransactionSummary,
      setLatestTransactionConfirmed,
      onSuccess,
      addRecentTransaction,
    ]
  );
};
