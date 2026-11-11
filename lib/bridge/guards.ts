import type { PublicClient } from "viem";

import {
  ARB_BRIDGE,
  ARB_INBOX,
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

type Reader = Pick<PublicClient, "readContract" | "getStorageAt">;

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

// EIP-1967 slots: where an upgradeable proxy keeps its code and its admin.
export const IMPL_SLOT =
  "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const ADMIN_SLOT =
  "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

/** The address held in a storage slot's low 20 bytes. */
export const slotAddress = (v: string | undefined) =>
  `0x${(v ?? "").slice(-40)}`.toLowerCase();

/**
 * The code and admin behind each upgradeable contract the bridge uses, as
 * read on 2026-10-30. An upgrade can keep the routing and Outbox checks
 * passing while changing what the contracts do, so a change here pauses
 * signing until it's reviewed and these are updated. The weekly health
 * check (health.live.ts) opens an issue when one changes. Livepeer's
 * tokens and gateways aren't proxies; their wiring is checked instead.
 */
export const PINS = {
  l1Router: {
    name: "Ethereum gateway router",
    address: L1_GATEWAY_ROUTER,
    impl: "0x52595021fa01b3e14ec6c88953afc8e35dff423c",
    admin: "0x9ad46fac0cf7f790e5be05a0f15223935a0c0ada",
  },
  inbox: {
    name: "Arbitrum Inbox",
    address: ARB_INBOX,
    impl: "0x7c058ad1d0ee415f7e7f30e62db1bcf568470a10",
    admin: "0x554723262467f125ac9e1cdfa9ce15cc53822dbd",
  },
  bridge: {
    name: "Arbitrum Bridge",
    address: ARB_BRIDGE,
    impl: "0xfe4749061fb052c354aac65b9fb0ccd7e20d2418",
    admin: "0x554723262467f125ac9e1cdfa9ce15cc53822dbd",
  },
  outbox: {
    name: "Arbitrum Outbox",
    address: ARB_OUTBOX,
    impl: "0x3fff9bdc3ce99d3d587b0d06aa7c4a10075193b4",
    admin: "0x554723262467f125ac9e1cdfa9ce15cc53822dbd",
  },
  l2Router: {
    name: "Arbitrum gateway router",
    address: L2_GATEWAY_ROUTER,
    impl: "0xe80eb0238029333e368e0bddb7acdf1b9cb28278",
    admin: "0xd570ace65c43af47101fc6250fd6fc63d1c22a86",
  },
} as const;

export type Pin = (typeof PINS)[keyof typeof PINS];

/** Whether a proxy still runs the reviewed code under the reviewed admin. */
export async function readPin(client: Reader, pin: Pin) {
  const [impl, admin] = await Promise.all([
    client.getStorageAt({ address: pin.address, slot: IMPL_SLOT }),
    client.getStorageAt({ address: pin.address, slot: ADMIN_SLOT }),
  ]);
  return { impl: slotAddress(impl), admin: slotAddress(admin) };
}

async function checkPins(client: Reader, pins: Pin[]) {
  const read = await Promise.all(pins.map((p) => readPin(client, p)));
  pins.forEach((p, i) => {
    if (read[i].impl !== p.impl || read[i].admin !== p.admin) {
      throw new BridgeChanged();
    }
  });
}

/**
 * Before a deposit or withdrawal: Arbitrum's router still sends LPT through
 * the gateway this app approves and pays, and the contracts on the way
 * still run the reviewed code. If governance moved LPT to another gateway
 * or upgraded one of them, stop rather than bridge the old way.
 */
export async function checkRoute(
  client: Reader,
  direction: "toArbitrum" | "toEthereum"
) {
  const [router, gateway, pins]: [`0x${string}`, string, Pin[]] =
    direction === "toArbitrum"
      ? [
          L1_GATEWAY_ROUTER,
          L1_LPT_GATEWAY,
          [PINS.l1Router, PINS.inbox, PINS.bridge],
        ]
      : [L2_GATEWAY_ROUTER, L2_LPT_GATEWAY, [PINS.l2Router]];
  const [current] = await Promise.all([
    client.readContract({
      address: router,
      abi: getGatewayAbi,
      functionName: "getGateway",
      // Both routers key LPT by its Ethereum address.
      args: [L1_LPT],
    }),
    checkPins(client, pins),
  ]);
  if (!same(current, gateway)) throw new BridgeChanged();
}

/**
 * Before a claim: Arbitrum's bridge still honors this Outbox, and both
 * still run the reviewed code. A retired Outbox would only revert, but
 * saying so up front beats a failed claim.
 */
export async function checkOutbox(client: Reader) {
  const [allowed] = await Promise.all([
    client.readContract({
      address: ARB_BRIDGE,
      abi: allowedOutboxesAbi,
      functionName: "allowedOutboxes",
      args: [ARB_OUTBOX],
    }),
    checkPins(client, [PINS.outbox, PINS.bridge]),
  ]);
  if (!allowed) throw new BridgeChanged();
}
