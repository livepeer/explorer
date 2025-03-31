import { ethers } from "ethers";

export const INFURA_RPC_URL = `https://arbitrum-mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`;
export const CONTRACT_ADDRESS = "0xcfe4e2879b786c3aa075813f0e364bb5accb6aa0";

export const VOTECAST_TOPIC0 = ethers.utils.id(
  "VoteCast(address,uint256,uint8,uint256,string)"
);

export const provider = new ethers.providers.JsonRpcProvider(INFURA_RPC_URL);

export const contractInterface = new ethers.utils.Interface([
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
]);
