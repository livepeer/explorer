import { Signer } from "ethers";
import { useEffect, useMemo, useState } from "react";
import { arbitrum, mainnet } from "viem/chains";
import { useAccount, useDisconnect } from "wagmi";

const useIsChainSupported = () => {
  const activeChain = useActiveChain();
  const supportedChains = [mainnet.id, arbitrum.id] as number[];

  return useMemo(
    () => (activeChain ? supportedChains.includes(activeChain.id) : false),
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
  const { connector, status } = useAccount();
  const [chainId, setChainId] = useState<number | null>(null);

  useEffect(() => {
    let provider: any;
    let unsub: (() => void) | undefined;

    (async () => {
      provider = await connector?.getProvider?.();
      if (!provider?.request) return;

      const hex = await provider.request({ method: "eth_chainId" });
      setChainId(parseInt(hex, 16));

      const onChainChanged = (nextHex: string) =>
        setChainId(parseInt(nextHex, 16));
      provider.on?.("chainChanged", onChainChanged);
      unsub = () => provider.removeListener?.("chainChanged", onChainChanged);
    })();

    return () => unsub?.();
  }, [connector, status]);

  const chains = [mainnet, arbitrum];
  const activeChain = useMemo(
    () => chains.find((chain) => chain.id === chainId),
    [chainId, chains]
  );

  return activeChain;
};

export function useDisconnectWallet() {
  const disconnect = useDisconnect();

  return () => {
    disconnect?.disconnect?.();
  };
}
