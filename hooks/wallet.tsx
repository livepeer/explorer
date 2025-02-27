import { Signer } from "ethers";
import { useMemo, useState } from "react";
import {
  useAccount,
  useDisconnect,
  useNetwork,
  useWalletClient,
} from "wagmi";

const useIsChainSupported = () => {
  const activeChain = useActiveChain();

  return useMemo(
    () => (activeChain ? !activeChain.unsupported : false),
    [activeChain],
  );
};

export const useAccountAddress = () => {
  const account = useAccount();

  const isChainSupported = useIsChainSupported();

  return isChainSupported && account?.address ? account.address : null;
};

export const useAccountSigner = () => {
  const isChainSupported = useIsChainSupported();

  const [signer, _setSigner] = useState<Signer | null>(null);

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
