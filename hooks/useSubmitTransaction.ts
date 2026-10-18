import { trackTransaction } from "@lib/analytics";
import { safe } from "@lib/api/abis/safe/Safe";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { capitalCase } from "change-case";
import { Hash, isHash } from "viem";
import { useAccount, useConfig } from "wagmi";
import { readContractQueryOptions } from "wagmi/query";

import {
  InputData,
  TransactionIdentifier,
  useExplorerStore,
} from "./useExplorerStore";
import { isNonSafeError, useIsSafe } from "./wallet";

/** Handle a submission even if its form unmounts while the wallet is open. */
export const useSubmitTransaction = (id: TransactionIdentifier) => {
  const {
    setLatestTransactionSummary,
    setLatestTransactionDetails,
    setLatestTransactionConfirmed,
    setLatestTransactionError,
  } = useExplorerStore();
  const config = useConfig();
  const { address, chainId } = useAccount();
  const queryClient = useQueryClient();
  const addRecentTransaction = useAddRecentTransaction();
  const isSafe = useIsSafe();

  return async (write: () => Promise<Hash>, args: InputData) => {
    const submissionId = setLatestTransactionSummary();
    const isCurrentSubmission = () =>
      useExplorerStore.getState().latestTransaction?.submissionId ===
      submissionId;

    // Reuse the Safe probe's query, but keep its result independent of React
    // effects and tied to the submitting account/chain if the form unmounts.
    const safeStatus =
      isSafe ??
      (address && chainId
        ? queryClient
            .fetchQuery({
              ...readContractQueryOptions(config, {
                address,
                chainId,
                abi: safe,
                functionName: "getThreshold",
              }),
              staleTime: Infinity,
              retry: false,
            })
            .then(
              () => true,
              (error) => (isNonSafeError(error) ? false : undefined)
            )
        : undefined);
    let hash: Hash;
    try {
      hash = await write();
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : String(error);
      if (isCurrentSubmission()) {
        setLatestTransactionError(message.replace("GraphQL error: ", ""));
      }
      return;
    }

    // These callbacks survive unmounting; effects watching mutation state do not.
    if (isCurrentSubmission()) {
      setLatestTransactionDetails(hash, id, args);
      setLatestTransactionConfirmed();
    }
    if (isHash(hash) && (await safeStatus) === false) {
      addRecentTransaction({ hash, description: capitalCase(id) });
      trackTransaction(config, id, args, hash, chainId);
    }
  };
};
