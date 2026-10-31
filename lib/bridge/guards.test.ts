import {
  ARB_BRIDGE,
  L1_GATEWAY_ROUTER,
  L1_LPT_GATEWAY,
  L2_GATEWAY_ROUTER,
  L2_LPT_GATEWAY,
} from "./config";
import {
  ADMIN_SLOT,
  BridgeChanged,
  checkOutbox,
  checkRoute,
  IMPL_SLOT,
  PINS,
} from "./guards";

const key = (a: string) => a.toLowerCase();
const word = (a: string) => `0x${"0".repeat(24)}${a.slice(2)}`;

/**
 * A client answering each contract with a fixed value, and each pinned
 * proxy's slots with its pins unless `upgraded` names it.
 */
const client = (answers: Record<string, unknown>, upgraded: string[] = []) => ({
  readContract: jest.fn(
    async ({ address }: { address: string }) => answers[address.toLowerCase()]
  ),
  getStorageAt: jest.fn(
    async ({ address, slot }: { address: string; slot: string }) => {
      const pin = Object.values(PINS).find(
        (p) => key(p.address) === key(address)
      );
      if (!pin) return undefined;
      if (upgraded.includes(key(address)) && slot === IMPL_SLOT) {
        return word("0x000000000000000000000000000000000000beef");
      }
      return word(slot === ADMIN_SLOT ? pin.admin : pin.impl);
    }
  ),
});

const routes = {
  [key(L1_GATEWAY_ROUTER)]: L1_LPT_GATEWAY.toLowerCase(),
  [key(L2_GATEWAY_ROUTER)]: L2_LPT_GATEWAY,
};

describe("checkRoute", () => {
  it("passes while each router sends LPT through our gateway", async () => {
    const c = client(routes);
    await expect(checkRoute(c as never, "toArbitrum")).resolves.toBeUndefined();
    await expect(checkRoute(c as never, "toEthereum")).resolves.toBeUndefined();
  });

  it("stops when a router names another gateway", async () => {
    const other = "0x000000000000000000000000000000000000dEaD";
    const c = client({
      [key(L1_GATEWAY_ROUTER)]: other,
      [key(L2_GATEWAY_ROUTER)]: other,
    });
    await expect(checkRoute(c as never, "toArbitrum")).rejects.toThrow(
      BridgeChanged
    );
    await expect(checkRoute(c as never, "toEthereum")).rejects.toThrow(
      BridgeChanged
    );
  });

  it("stops when a contract on the way was upgraded, routing aside", async () => {
    await expect(
      checkRoute(
        client(routes, [key(PINS.inbox.address)]) as never,
        "toArbitrum"
      )
    ).rejects.toThrow(BridgeChanged);
    await expect(
      checkRoute(
        client(routes, [key(PINS.l2Router.address)]) as never,
        "toEthereum"
      )
    ).rejects.toThrow(BridgeChanged);
  });
});

describe("checkOutbox", () => {
  it("passes while the bridge honors the Outbox, and stops when not", async () => {
    await expect(
      checkOutbox(client({ [key(ARB_BRIDGE)]: true }) as never)
    ).resolves.toBeUndefined();
    await expect(
      checkOutbox(client({ [key(ARB_BRIDGE)]: false }) as never)
    ).rejects.toThrow(BridgeChanged);
  });

  it("stops when the Outbox was upgraded in place", async () => {
    await expect(
      checkOutbox(
        client({ [key(ARB_BRIDGE)]: true }, [key(PINS.outbox.address)]) as never
      )
    ).rejects.toThrow(BridgeChanged);
  });
});
