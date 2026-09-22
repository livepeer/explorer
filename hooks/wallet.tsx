import { safe } from "@lib/api/abis/safe/Safe";
import {
  ALL_SUPPORTED_CHAIN_IDS,
  DEFAULT_CHAIN_ID,
  L1_CHAIN_ID,
} from "@lib/chains";
import { Signer } from "ethers";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useAccount, useDisconnect, useReadContract } from "wagmi";

const useIsChainSupported = () => {
  const activeChain = useActiveChain();

  return useMemo(
    () =>
      activeChain
        ? ALL_SUPPORTED_CHAIN_IDS.map((chain) => chain.id as number).includes(
            activeChain.id
          )
        : false,
    [activeChain]
  );
};

export const useAccountAddress = () => {
  const account = useAccount();

  const isChainSupported = useIsChainSupported();

  return isChainSupported && account?.address ? account.address : null;
};

/**
 * Whether the connected account is a Safe. getThreshold() only succeeds on a
 * Safe proxy: EOAs return no data and other contracts revert.
 */
export const useIsSafe = () => {
  const address = useAccountAddress();

  const { data } = useReadContract({
    address: address ?? undefined,
    abi: safe,
    functionName: "getThreshold",
    query: { enabled: Boolean(address), retry: false, staleTime: Infinity },
  });

  return data !== undefined;
};

export const useAccountSigner = () => {
  const isChainSupported = useIsChainSupported();

  const [signer] = useState<Signer | null>(null);

  // useEffect(() => {
  //   async function getSigner() {
  //     if (walletClient.) {
  //       try {
  //         const signer = await account?.connector?.getSigner?.();
  //         setSigner(signer ?? null);
  //       } catch (e) {
  //         console.log(e);
  //       }
  //     }
  //   }
  //   getSigner();
  // }, [account.status]);

  return isChainSupported ? signer : null;
};

export const useActiveChain = () => {
  const { chain } = useAccount();
  return chain;
};

export const useExpectedChainId = () => {
  const { pathname } = useRouter();
  return pathname.startsWith("/migrate") ? L1_CHAIN_ID : DEFAULT_CHAIN_ID;
};

export const useIsWrongRouteChain = () => {
  const expectedChainId = useExpectedChainId();
  const { chainId, status } = useAccount();

  return Boolean(
    status === "connected" && chainId && chainId !== expectedChainId
  );
};

export function useDisconnectWallet() {
  const disconnect = useDisconnect();

  return () => {
    disconnect?.disconnect?.();
  };
}
