import { z } from "zod";

const ContractLinkSchema = z.object({
  name: z.string(),
  address: z.string(),
  link: z.string(),
});

export const ContractInfoSchema = z.object({
  Controller: ContractLinkSchema.nullable(),
  L1Migrator: ContractLinkSchema.nullable(),
  L2Migrator: ContractLinkSchema.nullable(),
  PollCreator: ContractLinkSchema.nullable(),
  BondingManager: ContractLinkSchema.nullable(),
  LivepeerToken: ContractLinkSchema.nullable(),
  LivepeerTokenFaucet: ContractLinkSchema.nullable(),
  MerkleSnapshot: ContractLinkSchema.nullable(),
  Minter: ContractLinkSchema.nullable(),
  RoundsManager: ContractLinkSchema.nullable(),
  ServiceRegistry: ContractLinkSchema.nullable(),
  TicketBroker: ContractLinkSchema.nullable(),
  LivepeerGovernor: ContractLinkSchema.nullable(),
  Treasury: ContractLinkSchema.nullable(),
  BondingVotes: ContractLinkSchema.nullable(),
});
