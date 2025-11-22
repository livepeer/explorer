import { ALL_SUPPORTED_CHAIN_IDS } from "@lib/chains";
import { Signer } from "ethers";
import { useMemo, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

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

export function useDisconnectWallet() {
  const disconnect = useDisconnect();

  return () => {
    disconnect?.disconnect?.();
  };
}
