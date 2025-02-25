import { type Address } from 'viem';
import { Contract, Interface, type Provider, type TransactionResponse } from 'ethers';
import { l1Migrator } from './L1Migrator';

export type L1MigratorContract = Contract & {
  migrateDelegator: (
    l1Addr: Address,
    refundAddr: Address,
    sig: `0x${string}`,
    maxGas: bigint,
    gasPriceBid: bigint,
    maxSubmissionCost: bigint,
    overrides?: {
      value?: bigint;
    }
  ) => Promise<TransactionResponse>;
};

export const getL1MigratorContract = (
  address: Address,
  provider: Provider
): L1MigratorContract => {
  const interface_ = new Interface(l1Migrator);
  return new Contract(
    address,
    interface_,
    provider
  ) as L1MigratorContract;
};
