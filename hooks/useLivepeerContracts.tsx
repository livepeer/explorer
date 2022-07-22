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

export const useLivepeerContracts = () => {
  const signer = useAccountSigner();

  const [livepeerContracts, setLivepeerContracts] = useState<LivepeerContracts>(
    {
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
        const livepeerToken = await getLivepeerToken(signer);
        const livepeerTokenFaucet = await getLivepeerTokenFaucet(signer);
        const bondingManager = await getBondingManager(signer);
        const roundsManager = await getRoundsManager(signer);
        const minter = await getMinter(signer);
        const merkleSnapshot = await getMerkleSnapshot(signer);
        const serviceRegistry = await getServiceRegistry(signer);
        const ticketBroker = await getTicketBroker(signer);
        const pollCreator = await getPollCreator(signer);

        setLivepeerContracts((prev) => ({
          ...prev,

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
  }, [signer, livepeerContracts.livepeerToken]);

  useEffect(() => {
    setLivepeerContracts((prev) => ({
      ...prev,

      l1Migrator: getL1Migrator(signer),
      l2Migrator: getL2Migrator(signer),
      inbox: getInbox(signer),
      arbRetryableTx: getArbRetryableTx(signer),
      nodeInterface: getNodeInterface(signer),
    }));
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
