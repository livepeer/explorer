import {
  getArbRetryableTx,
  getBondingManager,
  getInbox,
  getL1Migrator,
  getL2Migrator,
  getLivepeerToken,
  getLivepeerTokenFaucet,
  getMerkleSnapshot,
  getMinter,
  getNodeInterface,
  getPollCreator,
  getRoundsManager,
  getServiceRegistry,
  getTicketBroker,
  getContractAddress,
} from "@lib/api/contracts";
import { CHAIN_INFO, DEFAULT_CHAIN_ID, l2Provider } from "@lib/chains";
import { Signer } from "ethers";

import { useCallback, useEffect, useState } from "react";
import { Poll__factory } from "typechain-types";
import { Poll } from "typechain-types/main";
import { useAccount } from "wagmi";
import { useAccountSigner } from "./wallet";

const useLivepeerContract = <T>(
  getContract: (signer: Signer) => Promise<T>
) => {
  const getContractMemoized = useCallback(getContract, []);
  const account = useAccount();

  const [livepeerContract, setLivepeerContract] = useState<T | null>(null);

  useEffect(() => {
    const fn = async () => {
      try {
        if (account.connector) {
          const contract = await getContractMemoized(
            await account.connector.getSigner()
          );

          setLivepeerContract(contract);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fn();
  }, [account.status, getContractMemoized]);

  return livepeerContract;
};

export const useL1Migrator = () =>
  useLivepeerContract(async (signer) => getL1Migrator(signer));

export const useL2Migrator = () =>
  useLivepeerContract(async (signer) => getL2Migrator(signer));

export const useInbox = () =>
  useLivepeerContract(async (signer) => getInbox(signer));

export const useArbRetryableTx = () =>
  useLivepeerContract(async (signer) => getArbRetryableTx(signer));

export const useNodeInterface = () =>
  useLivepeerContract(async (signer) => getNodeInterface(signer));

export const useLivepeerToken = () =>
  useLivepeerContract(async (signer) => getLivepeerToken(signer));

export const useLivepeerTokenFaucet = () =>
  useLivepeerContract(async (signer) => getLivepeerTokenFaucet(signer));

export const useBondingManager = () =>
  useLivepeerContract(async (signer) => getBondingManager(signer));

export const useRoundsManager = () =>
  useLivepeerContract(async (signer) => getRoundsManager(signer));

export const useMinter = () =>
  useLivepeerContract(async (signer) => getMinter(signer));

export const useMerkleSnapshot = () =>
  useLivepeerContract(async (signer) => getMerkleSnapshot(signer));

export const useServiceRegistry = () =>
  useLivepeerContract(async (signer) => getServiceRegistry(signer));

export const useTicketBroker = () =>
  useLivepeerContract(async (signer) => getTicketBroker(signer));

export const usePollCreator = () =>
  useLivepeerContract(async (signer) => getPollCreator(signer));

export const useLivepeerPoll = (address: string | null): Poll | null => {
  const signer = useAccountSigner();

  const [livepeerPoll, setLivepeerPoll] = useState<Poll | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (address) {
          const poll = Poll__factory.connect(address, signer ?? l2Provider);

          setLivepeerPoll(poll);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [address, signer]);

  return livepeerPoll;
};
