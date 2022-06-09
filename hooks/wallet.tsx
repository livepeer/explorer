import { Signer } from "ethers";
import { l1Provider } from "lib/chains";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useDisconnect, useNetwork } from "wagmi";

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

  return isChainSupported && account?.data?.address
    ? account.data.address
    : null;
};

export const useAccountSigner = () => {
  const account = useAccount();

  const isChainSupported = useIsChainSupported();

  const [signer, setSigner] = useState<Signer | null>(null);

  useEffect(() => {
    async function getSigner() {
      if (account?.data?.connector?.getSigner) {
        try {
          const signer = await account?.data?.connector?.getSigner?.();
          setSigner(signer ?? null);
        } catch (e) {
          console.log(e);
        }
      }
    }
    getSigner();
  }, [account?.data]);

  return isChainSupported ? signer : null;
};

const ensAddressCache: { [key: string]: string | undefined | null } = {};

export const useEnsName = (address: string | null | undefined, defaultValue?: string | null | undefined) => {
  const [ens, setENS] = useState<string | null>(defaultValue || ensAddressCache[address]);

  useEffect(() => {
    async function getENS() {
      if (address) {
        try {
          const name = await l1Provider.lookupAddress(address);
          setENS(name);
          ensAddressCache[address] = name;
        } catch (e) {
          console.log(e);
        }
      }
    }
    if (!ens) {
      getENS();
    }
  }, [address, ens]);

  return ens;
};

export const useAccountEnsData = () => {
  const address = useAccountAddress();

  const isChainSupported = useIsChainSupported();

  const [ens, setENS] = useState<{
    avatar: string | null;
    name: string | null;
  } | null>(null);

  useEffect(() => {
    async function getENS() {
      if (address) {
        try {
          const name = await l1Provider.lookupAddress(address);
          const avatar = await l1Provider.getAvatar(address);
          setENS({ name, avatar });
        } catch (e) {
          console.log(e);
        }
      }
    }
    getENS();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return isChainSupported ? ens : null;
};

export const useActiveChain = () => {
  const { activeChain } = useNetwork();

  return activeChain;
};

export function useDisconnectWallet() {
  const disconnect = useDisconnect();

  return () => {
    disconnect?.disconnect?.();
  };
}
