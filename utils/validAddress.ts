import { ethers } from "ethers";

export const isValidAddress = (address) => {
  try {
    return ethers.utils.getAddress(address);
  } catch (e) {
    return false;
  }
};
