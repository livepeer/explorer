import { ethers } from "ethers";

export const isValidAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch (e) {
    return false;
  }
};
