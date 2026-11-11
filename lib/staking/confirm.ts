import { isAddressEqual } from "viem";

import { PROTOCOL_CONTRACTS, type ProtocolContractName } from "@/lib/config";

/** The pinned address when the registry's answer matches it. */
export function confirmedContract(
  name: ProtocolContractName,
  registered: string | undefined
): `0x${string}` | undefined {
  if (!registered) return undefined;
  const pinned = PROTOCOL_CONTRACTS[name];
  if (isAddressEqual(registered as `0x${string}`, pinned)) return pinned;
  console.error(
    `Controller returned ${registered} for ${name}, expected ${pinned}; refusing to use it.`
  );
  return undefined;
}
