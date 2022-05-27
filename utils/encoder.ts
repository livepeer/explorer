import { CHAIN_INFO, DEFAULT_CHAIN_ID, L1_CHAIN_ID } from "lib/chains";
import { ethers } from "ethers";

const params = {
  // Replace with the chainId of the chain that the L1Migrator is deployed on
  chainId: L1_CHAIN_ID,
  // Replace with the address of the L1Migrator
  verifyingContract: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
};

const domain = {
  name: "Livepeer L1Migrator",
  version: "1",
  chainId: params.chainId,
  verifyingContract: params.verifyingContract,
};

const types = {
  MigrateDelegator: [
    { name: "l1Addr", type: "address" },
    { name: "l2Addr", type: "address" },
  ],
};

type Value = {
  l1Addr: string;
  l2Addr: string;
};

const genTypedData = (domain, types, value: Value) => {
  const payload = ethers.utils._TypedDataEncoder.getPayload(
    domain,
    types,
    value
  );
  return payload;
};

module.exports = {
  genTypedData,
  domain,
  types,
};
