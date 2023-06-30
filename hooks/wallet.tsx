import { Signer } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect, useNetwork, usePublicClient, useWalletClient } from "wagmi";

const useIsChainSupported = () => {
  const activeChain = useActiveChain();

  return useMemo(
    () => (activeChain ? !activeChain.unsupported : false),
    [activeChain]
  );
};

export const useAccountAddress = () => {
  const account = useAccount();

  const isChainSupported = useIsChainSupported();

  return isChainSupported && account?.address ? account.address : null;
};

export const useAccountSigner = () => {
  const walletClient = useWalletClient();

  const isChainSupported = useIsChainSupported();

  const [signer, setSigner] = useState<Signer | null>(null);

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
  const { chain } = useNetwork();

  return chain;
};

export function useDisconnectWallet() {
  const disconnect = useDisconnect();

  return () => {
    disconnect?.disconnect?.();
  };
}
