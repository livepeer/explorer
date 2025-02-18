import { Signer } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect, useConfig, useWalletClient } from "wagmi";
import { SUPPORTED_CHAINS } from "../lib/chains";

const useIsChainSupported = () => {
  const { chain } = useAccount();
  const { chains } = useConfig();

  return useMemo(
    () => chain ? chains.some(c => c.id === chain.id) : false,
    [chain, chains]
  );
};

export const useAccountAddress = () => {
  const { address } = useAccount();
  const isChainSupported = useIsChainSupported();

  return isChainSupported && address ? address : null;
};

export const useAccountSigner = () => {
  const { data: walletClient } = useWalletClient();
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
  const { chain } = useAccount();
  return chain;
};

export function useDisconnectWallet() {
  const { disconnect } = useDisconnect();

  return () => {
    disconnect?.();
  };
}
