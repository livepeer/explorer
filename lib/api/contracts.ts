import { CHAIN_INFO, DEFAULT_CHAIN_ID, l2PublicClient } from "@lib/chains";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { Address } from "viem";
import { controller } from "./abis/main/Controller";

// STATIC ADDRESSES

export const getL1MigratorAddress = (): Address =>
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator;
export const getL2MigratorAddress = (): Address =>
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator;
export const getInboxAddress = (): Address =>
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox;
export const getArbRetryableTxAddress = (): Address =>
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.arbRetryableTx;
export const getNodeInterfaceAddress = (): Address =>
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.nodeInterface;
export const getPollCreatorAddress = (): Address =>
  CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.pollCreator;

// DYNAMIC ADDRESSES FROM CONTROLLER

// Get contract address from Controller
export const getContractAddress = async (name: string) => {
  const hash = keccak256(toUtf8Bytes(name)) as Address;

  const address = await l2PublicClient.readContract({
    address: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.controller,
    abi: controller,
    functionName: "getContract",
    args: [hash],
  });

  return address;
};

export const getLivepeerTokenAddress = async () => {
  return getContractAddress("LivepeerToken");
};

export const getLivepeerTokenFaucetAddress = async () =>
  getContractAddress("LivepeerTokenFaucet");
export const getBondingManagerAddress = async () =>
  getContractAddress("BondingManager");
export const getRoundsManagerAddress = async () =>
  getContractAddress("RoundsManager");
export const getMinterAddress = async () => getContractAddress("Minter");
export const getMerkleSnapshotAddress = async () =>
  getContractAddress("MerkleSnapshot");
export const getServiceRegistryAddress = async () =>
  getContractAddress("ServiceRegistry");
export const getTicketBrokerAddress = async () =>
  getContractAddress("TicketBroker");
