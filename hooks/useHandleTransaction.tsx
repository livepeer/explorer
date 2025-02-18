import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { type UseSimulateContractReturnType } from "wagmi";
import { useEffect } from "react";
import { TransactionIdentifier, useExplorerStore } from "./useExplorerStore";
import { capitalCase } from "change-case";

export const useHandleTransaction = (
  id: TransactionIdentifier,
  simulationData: { hash?: `0x${string}` } | undefined,
  error: Error | null,
  isLoading: boolean,
  isSuccess: boolean,
  args: any,
  onSuccess?: ((result: { hash?: `0x${string}` }) => Promise<void> | void) | null
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
    if (simulationData?.hash) {
      addRecentTransaction({
        hash: simulationData.hash,
        description: capitalCase(id),
      });
    }
  }, [simulationData]);

  useEffect(() => {
    if (simulationData) {
      // Store simulation data for later use
      setLatestTransactionDetails(simulationData.hash!, id, args);

      if (onSuccess) {
        onSuccess(simulationData);
      }
    }
  }, [simulationData]);

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
