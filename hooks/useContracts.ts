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
// TODO: Remove the hardcoded addresses after new devnet deploy
export const useLivepeerGovernorAddress = () =>
  ({ data: "0xD36575965fe609640dF08296EdDAcFc41b3D8540" } as const)
  // useContractAddress("LivepeerGovernor"));
export const useTreasuryAddress = () =>
  ({ data: "0xA5B10e911a308B4480F6384cb9B734C57626aC0C" } as const)
  // useContractAddress("Treasury"));
export const useGovernorVotesAddress = () =>
  ({ data: "0x04641C6BCE1fe5cBe136091b6E1f04832F688Cf7" } as const)
  // useContractAddress("BondingCheckpointsVotes"));
