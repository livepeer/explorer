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
} from "@lib/api/contracts";
import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  l1Provider,
  l2Provider,
} from "@lib/chains";
import { BigNumber, Signer } from "ethers";

import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { useEffect, useState } from "react";
import {
  ArbRetryableTx,
  ArbRetryableTx__factory,
  BondingManager,
  BondingManager__factory,
  Controller,
  Controller__factory,
  Inbox,
  Inbox__factory,
  L1Migrator,
  L1Migrator__factory,
  L2Migrator__factory,
  LivepeerToken,
  LivepeerTokenFaucet,
  LivepeerToken__factory,
  MerkleSnapshot,
  MerkleSnapshot__factory,
  Minter,
  Minter__factory,
  NodeInterface,
  NodeInterface__factory,
  PollCreator__factory,
  Poll__factory,
  RoundsManager,
  RoundsManager__factory,
  ServiceRegistry,
  ServiceRegistry__factory,
  TicketBroker,
  TicketBroker__factory,
} from "typechain-types";
import { LivepeerTokenFaucet__factory } from "typechain-types/factories/main/LivepeerTokenFaucet__factory";
import { L2Migrator, Poll, PollCreator } from "typechain-types/main";
import { useAccount } from "wagmi";
import { useAccountSigner } from "./wallet";

export type LivepeerContracts = {
  l1Migrator: L1Migrator | null;
  l2Migrator: L2Migrator | null;
  inbox: Inbox | null;
  arbRetryableTx: ArbRetryableTx | null;
  nodeInterface: NodeInterface | null;

  livepeerToken: LivepeerToken | null;
  livepeerTokenFaucet: LivepeerTokenFaucet | null;
  bondingManager: BondingManager | null;
  roundsManager: RoundsManager | null;
  minter: Minter | null;
  merkleSnapshot: MerkleSnapshot | null;
  serviceRegistry: ServiceRegistry | null;
  ticketBroker: TicketBroker | null;
  pollCreator: PollCreator | null;
};

const useLivepeerContract = <T>(
  getContract: (signer: Signer) => Promise<T>
) => {
  const signer = useAccountSigner();

  const [livepeerContract, setLivepeerContract] = useState<T | null>(null);

  useEffect(() => {
    const fn = async () => {
      try {
        const contract = await getContract(signer);

        setLivepeerContract(contract);
      } catch (e) {
        console.error(e);
      }
    };

    if (!livepeerContract) {
      fn();
    }
  }, [signer, getContract, livepeerContract]);

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

export const useL1RoundNumber = (): number | null => {
  const [l1RoundNumber, setL1RoundNumber] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setL1RoundNumber(await l1Provider.getBlockNumber());
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return l1RoundNumber;
};
