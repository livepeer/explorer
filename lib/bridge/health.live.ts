/**
 * The bridge's health check: runs this app's own bridge code against
 * Ethereum and Arbitrum mainnet, to catch a change on either side before
 * people hit it. Not part of `pnpm test` (it needs the network); run it
 * with `pnpm bridge:health`, and CI runs it weekly
 * (.github/workflows/bridge-health.yml).
 *
 * When it fails, read the upgrade that caused it (Arbitrum DAO proposals,
 * ArbOS release notes, Livepeer governance), check the bridge still works
 * the way this app assumes, then update the code or the pins (guards.ts).
 */
import { createPublicClient, http, type PublicClient } from "viem";
import { arbitrum, mainnet } from "viem/chains";

import snapshot from "@/data/bridge-withdrawals.json";

import { checkClaim } from "./claim";
import {
  ARB_BRIDGE,
  ARB_INBOX,
  ARB_OUTBOX,
  ARB_PUBLIC_RPC,
  executeTransactionAbi,
  L1_LPT,
  L1_LPT_GATEWAY,
  L2_LPT,
  L2_LPT_GATEWAY,
} from "./config";
import { MAX_DEPOSIT_VALUE, priceDeposit } from "./deposit";
import { checkOutbox, checkRoute, PINS, readPin } from "./guards";
import { claimArgs, ClaimError } from "./withdrawals-server";

jest.setTimeout(180_000);

const l1 = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.L1_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
    { retryCount: 3 }
  ),
}) as PublicClient;
const l2 = createPublicClient({
  chain: arbitrum,
  transport: http(ARB_PUBLIC_RPC, { retryCount: 3 }),
}) as PublicClient;

/** Each pinned proxy, with the network it's on. */
const PINNED = [
  { ...PINS.l1Router, client: l1 },
  { ...PINS.inbox, client: l1 },
  { ...PINS.bridge, client: l1 },
  { ...PINS.outbox, client: l1 },
  { ...PINS.l2Router, client: l2 },
];

const gatewayAbi = [
  {
    type: "function",
    name: "counterpartGateway",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "inbox",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

const bridgeOfAbi = [
  {
    type: "function",
    name: "bridge",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

const lower = (a: string) => a.toLowerCase();

describe("bridge contracts", () => {
  it.each([
    ["Ethereum LPT", l1, L1_LPT],
    ["Ethereum LPT gateway", l1, L1_LPT_GATEWAY],
    ["Arbitrum LPT", l2, L2_LPT],
    ["Arbitrum LPT gateway", l2, L2_LPT_GATEWAY],
  ] as const)("%s has code", async (_, client, address) => {
    const code = await client.getCode({ address });
    expect(code && code.length > 2).toBe(true);
  });

  // The same pins pause signing in the app (guards.ts): update them there.
  it.each(PINNED.map((p) => [p.name, p] as const))(
    "%s runs the reviewed code, under the reviewed admin",
    async (_, p) => {
      const { impl, admin } = await readPin(p.client, p);
      expect(impl).toBe(p.impl);
      expect(admin).toBe(p.admin);
    }
  );
});

describe("bridge wiring", () => {
  it("each router still sends LPT through Livepeer's gateway", async () => {
    await checkRoute(l1, "toArbitrum");
    await checkRoute(l2, "toEthereum");
  });

  it("the gateways name each other and aren't paused", async () => {
    const [l1Peer, l2Peer, l1Paused, l2Paused] = await Promise.all([
      l1.readContract({
        address: L1_LPT_GATEWAY,
        abi: gatewayAbi,
        functionName: "counterpartGateway",
      }),
      l2.readContract({
        address: L2_LPT_GATEWAY,
        abi: gatewayAbi,
        functionName: "counterpartGateway",
      }),
      l1.readContract({
        address: L1_LPT_GATEWAY,
        abi: gatewayAbi,
        functionName: "paused",
      }),
      l2.readContract({
        address: L2_LPT_GATEWAY,
        abi: gatewayAbi,
        functionName: "paused",
      }),
    ]);
    expect(lower(l1Peer)).toBe(lower(L2_LPT_GATEWAY));
    expect(lower(l2Peer)).toBe(lower(L1_LPT_GATEWAY));
    expect(l1Paused).toBe(false);
    expect(l2Paused).toBe(false);
  });

  it("deposits reach the Inbox and Bridge this app prices against", async () => {
    const inbox = await l1.readContract({
      address: L1_LPT_GATEWAY,
      abi: gatewayAbi,
      functionName: "inbox",
    });
    expect(lower(inbox)).toBe(lower(ARB_INBOX));
    const bridge = await l1.readContract({
      address: ARB_INBOX,
      abi: bridgeOfAbi,
      functionName: "bridge",
    });
    expect(lower(bridge)).toBe(lower(ARB_BRIDGE));
  });

  it("Arbitrum's bridge still honors the Outbox", async () => {
    await checkOutbox(l1);
  });
});

describe("bridge flows", () => {
  it("prices a deposit well under the fee cap", async () => {
    const someone = "0x000000000000000000000000000000000000dEaD";
    const p = await priceDeposit(l1, l2, {
      from: someone,
      to: someone,
      amount: 10n ** 18n,
    });
    expect(p.value).toBeGreaterThan(0n);
    // A quarter of the cap leaves room for busy days; past that, revisit
    // the cap or the headroom before deposits start to fail.
    expect(p.value).toBeLessThan(MAX_DEPOSIT_VALUE / 4n);
  });

  it("builds a claim that passes the app's checks and would succeed", async () => {
    // Long-unclaimed withdrawals make good samples: ready, and still open.
    for (const w of snapshot.withdrawals) {
      let args;
      try {
        args = await claimArgs(w.id);
      } catch (e) {
        if (e instanceof ClaimError && e.status === 409) continue;
        throw e;
      }
      const call = checkClaim(args, w);
      await l1.simulateContract({
        address: ARB_OUTBOX,
        abi: executeTransactionAbi,
        functionName: "executeTransaction",
        args: call,
        // Anyone may claim; the LPT still goes to the withdrawal's owner.
        account: "0x000000000000000000000000000000000000dEaD",
      });
      return;
    }
    throw new Error(
      "No open withdrawal to test with: refresh the snapshot (node scripts/bridge-withdrawals.mjs)."
    );
  });
});

describe("withdrawals snapshot", () => {
  // Every build refreshes the snapshot it ships (`pnpm build`), so the
  // committed file is only the fallback for a build whose refresh failed.
  // A year old means those refreshes have been failing quietly, or nobody
  // has refreshed the fallback in a long while: worth a look either way.
  it("was refreshed within the last year", async () => {
    const block = await l2.getBlock({ blockNumber: BigInt(snapshot.toBlock) });
    const ageDays = (Date.now() / 1000 - Number(block.timestamp)) / 86_400;
    if (ageDays > 365) {
      throw new Error(
        `The committed withdrawals snapshot is ${Math.floor(
          ageDays
        )} days old: run node scripts/bridge-withdrawals.mjs and commit it, and check builds' logs for "keeping the committed snapshot".`
      );
    }
  });
});
