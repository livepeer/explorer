import { l1Provider } from "lib/chains";
import { ethers, Signer } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useBalance, useConnect, useDisconnect } from "wagmi";

export const useAccountAddress = () => {
  const account = useAccount();

  return account?.data?.address ?? null;
};

export const useAccountSigner = () => {
  const account = useAccount();

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

  return signer;
};

export const useAccountEnsData = () => {
  const address = useAccountAddress();

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

  return ens;
};

export const useAccountBalance = () => {
  const address = useAccountAddress();

  const { data } = useBalance({
    addressOrName: address,
  });

  const [balance, setBalance] = useState(null);
  useEffect(() => {
    if (data?.value) {
      setBalance(+parseFloat(ethers.utils.formatEther(data.value)).toFixed(4));
    }
  }, [data?.value]);

  return balance;
};

export const useConnectorName = () => {
  const data = useConnect();

  return data?.activeConnector?.name;
};

export const useActiveChainId = () => {
  const [chainId, setChainId] = useState<number | null>(null);
  const data = useConnect();

  useEffect(() => {
    (async () => {
      if (data?.activeConnector) {
        setChainId(Number(await data.activeConnector.getChainId()));
      }
    })();
  }, [data?.activeConnector]);

  return chainId;
};

export function useDisconnectWallet() {
  const disconnect = useDisconnect();

  return () => {
    disconnect?.disconnect?.();
  };
}
