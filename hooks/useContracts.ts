import { controller } from "@lib/api/abis/main/Controller";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { useMemo } from "react";
import { Address } from "viem";
import { useContractRead } from "wagmi";

// DYNAMIC ADDRESSES FROM CONTROLLER

// Get contract address from Controller
const useContractAddress = (name: string) => {
  const hash = useMemo(() => keccak256(toUtf8Bytes(name)) as Address, [name]);

  return useContractRead({
    address: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.controller,
    abi: controller,
    functionName: "getContract",
    args: [hash],
  });
};

export const useLivepeerTokenAddress = () =>
  useContractAddress("LivepeerToken");
export const useLivepeerTokenFaucetAddress = () =>
  useContractAddress("LivepeerTokenFaucet");
export const useBondingManagerAddress = () =>
  useContractAddress("BondingManager");
export const useRoundsManagerAddress = () =>
  useContractAddress("RoundsManager");
export const useMinterAddress = () => useContractAddress("Minter");
export const useMerkleSnapshotAddress = () =>
  useContractAddress("MerkleSnapshot");
export const useServiceRegistryAddress = () =>
  useContractAddress("ServiceRegistry");
export const useTicketBrokerAddress = () => useContractAddress("TicketBroker");
export const useLivepeerGovernorAddress = () =>
  useContractAddress("LivepeerGovernor");
export const useTreasuryAddress = () =>
  useContractAddress("Treasury");
export const useBondingVotesAddress = () => useContractAddress("BondingVotes");
