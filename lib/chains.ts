import {
  CHAIN_INFO,
  NetworkType,
  SupportedL2ChainId,
} from "../constants/chains";

export function isL2ChainId(
  chainId: number | undefined
): chainId is SupportedL2ChainId {
  return (
    typeof chainId === "number" &&
    CHAIN_INFO[chainId].networkType === NetworkType.L2
  );
}
