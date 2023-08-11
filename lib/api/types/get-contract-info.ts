import { Address } from "viem";

export type ContractLink = {
  name: string;
  address: Address;
  link: string;
};

export type ContractInfo = {
  // ArbRetryableTx: ContractLink  | null;
  Controller: ContractLink | null;
  // Inbox: ContractLink  | null;
  L1Migrator: ContractLink | null;
  L2Migrator: ContractLink | null;
  // NodeInterface: ContractLink  | null;
  PollCreator: ContractLink | null;

  BondingManager: ContractLink | null;
  LivepeerToken: ContractLink | null;
  LivepeerTokenFaucet: ContractLink | null;
  MerkleSnapshot: ContractLink | null;
  Minter: ContractLink | null;
  RoundsManager: ContractLink | null;
  ServiceRegistry: ContractLink | null;
  TicketBroker: ContractLink | null;
  LivepeerGovernor: ContractLink | null;
  Treasury: ContractLink | null;
  GovernorVotes: ContractLink | null;
};
