import {
  ARB_BRIDGE,
  L1_GATEWAY_ROUTER,
  L1_LPT_GATEWAY,
  L2_GATEWAY_ROUTER,
  L2_LPT_GATEWAY,
} from "./config";
import { BridgeChanged, checkOutbox, checkRoute } from "./guards";

/** A client answering each contract with a fixed value. */
const client = (answers: Record<string, unknown>) => ({
  readContract: jest.fn(
    async ({ address }: { address: string }) => answers[address.toLowerCase()]
  ),
});

const key = (a: string) => a.toLowerCase();

describe("checkRoute", () => {
  it("passes while each router sends LPT through our gateway", async () => {
    const c = client({
      [key(L1_GATEWAY_ROUTER)]: L1_LPT_GATEWAY.toLowerCase(),
      [key(L2_GATEWAY_ROUTER)]: L2_LPT_GATEWAY,
    });
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
});
