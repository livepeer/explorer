import { injected } from "@lib/connectors";
import { useWeb3React } from "@web3-react/core";
import { l1Provider } from "constants/chains";
import { SUPPORTED_WALLETS } from "constants/wallet";
import { ethers } from "ethers";
import { useEffect, useState } from "react";

// TODO(chase): refactor to use wagmi
export const useAccountAddress = () => {
  const context = useWeb3React();

  return context?.account ?? null;
};

export const useAccountSigner = () => {
  const context = useWeb3React();

  return context?.library?.getSigner() ?? null;
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
  const { account, library, chainId } = useWeb3React();

  const [balance, setBalance] = useState(null);
  useEffect(() => {
    if (!!account && !!library) {
      let stale = false;

      library
        .getBalance(account)
        .then((balance) => {
          if (!stale) {
            setBalance(
              +parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
            );
          }
        })
        .catch(() => {
          if (!stale) {
            setBalance(null);
          }
        });

      return () => {
        stale = true;
        setBalance(undefined);
      };
    }
  }, [account, library, chainId]);

  return balance;
};

export const useConnectorName = () => {
  const { connector } = useWeb3React();

  const isMetaMask =
    window["ethereum"] && window["ethereum"].isMetaMask ? true : false;
  const name = Object.keys(SUPPORTED_WALLETS)
    .filter(
      (k) =>
        SUPPORTED_WALLETS[k].connector === connector &&
        (connector !== injected || isMetaMask === (k === "METAMASK"))
    )
    .map((k) => SUPPORTED_WALLETS[k].name)[0];

  return name;
};

export const useActiveChainId = () => {
  const [chainId, setChainId] = useState<number | null>(null);
  const { connector } = useWeb3React();

  useEffect(() => {
    (async () => {
      if (connector) {
        setChainId(Number(await connector.getChainId()));
      }
    })();
  }, [connector]);

  return chainId;
};

export function useDisconnectWallet() {
  const { connector } = useWeb3React();

  return connector?.deactivate;
}
