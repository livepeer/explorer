import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  l1Provider,
  l2Provider,
} from "@lib/chains";
import { BigNumber } from "ethers";

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
import { useAccountSigner } from "./wallet";

const controller = Controller__factory.connect(
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.controller,
  l2Provider
);

// Get contract address from Controller
const getContractAddress = async (name: string) => {
  const hash = keccak256(toUtf8Bytes(name));
  const address = await controller.getContract(hash);

  return address;
};

export type LivepeerContracts = {
  controller: Controller;

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

export const useLivepeerContracts = () => {
  const signer = useAccountSigner();

  const [livepeerContracts, setLivepeerContracts] = useState<LivepeerContracts>(
    {
      controller,

      l1Migrator: null,
      l2Migrator: null,
      inbox: null,
      arbRetryableTx: null,
      nodeInterface: null,

      livepeerToken: null,
      livepeerTokenFaucet: null,
      bondingManager: null,
      roundsManager: null,
      minter: null,
      merkleSnapshot: null,
      serviceRegistry: null,
      ticketBroker: null,
      pollCreator: null,
    }
  );

  useEffect(() => {
    const fn = async () => {
      try {
        const l2ProviderOrSigner = signer ?? l2Provider;

        const l1Migrator = L1Migrator__factory.connect(
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
          signer ?? l1Provider
        );

        const l2Migrator = L2Migrator__factory.connect(
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
          l2ProviderOrSigner
        );

        const inbox = Inbox__factory.connect(
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
          l2ProviderOrSigner
        );

        const arbRetryableTx = ArbRetryableTx__factory.connect(
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.arbRetryableTx,
          l2ProviderOrSigner
        );

        const nodeInterface = NodeInterface__factory.connect(
          CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.nodeInterface,
          l2ProviderOrSigner
        );

        const livepeerToken = LivepeerToken__factory.connect(
          await getContractAddress("LivepeerToken"),
          l2ProviderOrSigner
        );
        const livepeerTokenFaucet = LivepeerTokenFaucet__factory.connect(
          await getContractAddress("LivepeerTokenFaucet"),
          l2ProviderOrSigner
        );
        const bondingManager = BondingManager__factory.connect(
          await getContractAddress("BondingManager"),
          l2ProviderOrSigner
        );
        const roundsManager = RoundsManager__factory.connect(
          await getContractAddress("RoundsManager"),
          l2ProviderOrSigner
        );
        const minter = Minter__factory.connect(
          await getContractAddress("Minter"),
          l2ProviderOrSigner
        );
        const merkleSnapshot = MerkleSnapshot__factory.connect(
          await getContractAddress("MerkleSnapshot"),
          l2ProviderOrSigner
        );
        const serviceRegistry = ServiceRegistry__factory.connect(
          await getContractAddress("ServiceRegistry"),
          l2ProviderOrSigner
        );
        const ticketBroker = TicketBroker__factory.connect(
          await getContractAddress("TicketBroker"),
          l2ProviderOrSigner
        );
        const pollCreator = PollCreator__factory.connect(
          await getContractAddress("PollCreator"),
          l2ProviderOrSigner
        );

        setLivepeerContracts((prev) => ({
          ...prev,

          l1Migrator,
          l2Migrator,
          inbox,
          arbRetryableTx,
          nodeInterface,

          livepeerToken,
          livepeerTokenFaucet,
          bondingManager,
          roundsManager,
          minter,
          merkleSnapshot,
          serviceRegistry,
          ticketBroker,
          pollCreator,
        }));
      } catch (e) {
        console.error(e);
      }
    };

    if (!livepeerContracts.livepeerToken) {
      fn();
    }
  }, [signer]);

  return livepeerContracts;
};

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

export const useCurrentRoundInfo = () => {
  const { roundsManager } = useLivepeerContracts();
  const [currentRoundInfo, setRoundInfo] = useState<{
    id: BigNumber;
    startBlock: BigNumber;
    initialized: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (roundsManager) {
          const id = await roundsManager.currentRound();
          const startBlock = await roundsManager.currentRoundStartBlock();
          const initialized = await roundsManager.currentRoundInitialized();
          setRoundInfo({ id, startBlock, initialized });
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [roundsManager]);

  return currentRoundInfo;
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
