import {
  CHAIN_INFO,
  DEFAULT_CHAIN_ID,
  l1Provider,
  l2Provider,
} from "@lib/chains";
import { Signer } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import {
  ArbRetryableTx__factory,
  BondingManager__factory,
  Controller__factory,
  Inbox__factory,
  L1Migrator__factory,
  L2Migrator__factory,
  LivepeerTokenFaucet__factory,
  LivepeerToken__factory,
  MerkleSnapshot__factory,
  Minter__factory,
  NodeInterface__factory,
  PollCreator__factory,
  RoundsManager__factory,
  ServiceRegistry__factory,
  TicketBroker__factory,
} from "typechain-types";

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

export const getL1Migrator = (signer?: Signer) => {
  return L1Migrator__factory.connect(
    CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
    signer ?? l1Provider
  );
};

export const getL2Migrator = (signer?: Signer) => {
  return L2Migrator__factory.connect(
    CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
    signer ?? l2Provider
  );
};

export const getInbox = (signer?: Signer) => {
  return Inbox__factory.connect(
    CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
    signer ?? l2Provider
  );
};

export const getArbRetryableTx = (signer?: Signer) => {
  return ArbRetryableTx__factory.connect(
    CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.arbRetryableTx,
    signer ?? l2Provider
  );
};

export const getNodeInterface = (signer?: Signer) => {
  return NodeInterface__factory.connect(
    CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.nodeInterface,
    signer ?? l2Provider
  );
};

export const getLivepeerToken = async (signer?: Signer) => {
  return LivepeerToken__factory.connect(
    await getContractAddress("LivepeerToken"),
    signer ?? l2Provider
  );
};

export const getLivepeerTokenFaucet = async (signer?: Signer) => {
  return LivepeerTokenFaucet__factory.connect(
    await getContractAddress("LivepeerTokenFaucet"),
    signer ?? l2Provider
  );
};

export const getBondingManager = async (signer?: Signer) => {
  return BondingManager__factory.connect(
    await getContractAddress("BondingManager"),
    signer ?? l2Provider
  );
};

export const getRoundsManager = async (signer?: Signer) => {
  return RoundsManager__factory.connect(
    await getContractAddress("RoundsManager"),
    signer ?? l2Provider
  );
};

export const getMinter = async (signer?: Signer) => {
  return Minter__factory.connect(
    await getContractAddress("Minter"),
    signer ?? l2Provider
  );
};

export const getMerkleSnapshot = async (signer?: Signer) => {
  return MerkleSnapshot__factory.connect(
    await getContractAddress("MerkleSnapshot"),
    signer ?? l2Provider
  );
};

export const getServiceRegistry = async (signer?: Signer) => {
  return ServiceRegistry__factory.connect(
    await getContractAddress("ServiceRegistry"),
    signer ?? l2Provider
  );
};

export const getTicketBroker = async (signer?: Signer) => {
  return TicketBroker__factory.connect(
    await getContractAddress("TicketBroker"),
    signer ?? l2Provider
  );
};

export const getPollCreator = async (signer?: Signer) => {
  return PollCreator__factory.connect(
    await getContractAddress("PollCreator"),
    signer ?? l2Provider
  );
};
