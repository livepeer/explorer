import type { PublicClient } from "viem";

import {
  ARB_BRIDGE,
  ARB_OUTBOX,
  L1_GATEWAY_ROUTER,
  L1_LPT,
  L1_LPT_GATEWAY,
  L2_GATEWAY_ROUTER,
  L2_LPT_GATEWAY,
} from "./config";

const getGatewayAbi = [
  {
    type: "function",
    name: "getGateway",
    stateMutability: "view",
    inputs: [{ name: "token", type: "address" }],
    outputs: [{ type: "address" }],
  },
] as const;

const allowedOutboxesAbi = [
  {
    type: "function",
    name: "allowedOutboxes",
    stateMutability: "view",
    inputs: [{ name: "outbox", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

/** Arbitrum or Livepeer changed the bridge since this app was built. */
export class BridgeChanged extends Error {
  constructor() {
    super(
      "Arbitrum's bridge for LPT has changed, so bridging is paused here. Use Arbitrum's bridge at bridge.arbitrum.io."
    );
    this.name = "BridgeChanged";
  }
}

type Reader = Pick<PublicClient, "readContract">;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/**
 * Before a deposit or withdrawal: Arbitrum's router still sends LPT through
 * the gateway this app approves and pays. If governance moved LPT to
 * another gateway, stop rather than bridge the old way.
 */
export async function checkRoute(
  client: Reader,
  direction: "toArbitrum" | "toEthereum"
) {
  const [router, gateway]: [`0x${string}`, string] =
    direction === "toArbitrum"
      ? [L1_GATEWAY_ROUTER, L1_LPT_GATEWAY]
      : [L2_GATEWAY_ROUTER, L2_LPT_GATEWAY];
  const current = await client.readContract({
    address: router,
    abi: getGatewayAbi,
    functionName: "getGateway",
    // Both routers key LPT by its Ethereum address.
    args: [L1_LPT],
  });
  if (!same(current, gateway)) throw new BridgeChanged();
}

/**
 * Before a claim: Arbitrum's bridge still honors this Outbox. A retired
 * Outbox would only revert, but saying so up front beats a failed claim.
 */
export async function checkOutbox(client: Reader) {
  const allowed = await client.readContract({
    address: ARB_BRIDGE,
    abi: allowedOutboxesAbi,
    functionName: "allowedOutboxes",
    args: [ARB_OUTBOX],
  });
  if (!allowed) throw new BridgeChanged();
}
