/** @jest-environment jsdom */
import { track } from "@vercel/analytics";

import { redactUrl, trackEventOnce, trackWalletConnected } from "./analytics";

jest.mock("@vercel/analytics", () => ({ track: jest.fn() }));
jest.mock("wagmi/actions", () => ({ getPublicClient: jest.fn() }));
// viem's chain definitions need TextEncoder, which jsdom doesn't have.
jest.mock("@/lib/config", () => ({ L2_CHAIN: { id: 42161 } }));

describe("redactUrl", () => {
  const url = (u: string) =>
    (redactUrl({ type: "pageview", url: u }) as { url: string }).url;

  it("removes addresses from paths and queries", () => {
    expect(
      url(
        "https://beta.explorer.livepeer.org/accounts/0xB29178bd5e0da702ab69129048af7b9fcf222026"
      )
    ).toBe("https://beta.explorer.livepeer.org/accounts/[address]");
    expect(
      url(
        "https://beta.explorer.livepeer.org/activity?q=0xb29178bd5e0da702ab69129048af7b9fcf222026"
      )
    ).toBe("https://beta.explorer.livepeer.org/activity?q=[address]");
  });

  it("removes ENS names but leaves the host alone", () => {
    expect(
      url("https://beta.explorer.livepeer.org/activity?q=titan-node.eth")
    ).toBe("https://beta.explorer.livepeer.org/activity?q=[name]");
    expect(url("https://beta.explorer.livepeer.org/orchestrators")).toBe(
      "https://beta.explorer.livepeer.org/orchestrators"
    );
  });
});

describe("trackWalletConnected", () => {
  it("tags the page a wallet was connected from", () => {
    trackWalletConnected("/");
    trackWalletConnected("/orchestrators");
    trackWalletConnected(
      "/orchestrators/0xb29178bd5e0da702ab69129048af7b9fcf222026"
    );
    trackWalletConnected(
      "/accounts/0xb29178bd5e0da702ab69129048af7b9fcf222026"
    );
    trackWalletConnected("/network");
    expect(jest.mocked(track).mock.calls.map(([, p]) => p?.surface)).toEqual([
      "home",
      "orchestrators_list",
      "orchestrator_detail",
      "account",
      "other",
    ]);
  });

  it("skips governance, which needs a wallet for its own reasons", () => {
    trackWalletConnected("/governance/polls/new");
    expect(track).not.toHaveBeenCalled();
  });
});

describe("trackEventOnce", () => {
  it("tracks each key once, ignoring case", () => {
    trackEventOnce("orchestrator_detail_viewed", "0xAbC");
    trackEventOnce("orchestrator_detail_viewed", "0xabc");
    trackEventOnce("orchestrator_detail_viewed", "0xdef");
    expect(track).toHaveBeenCalledTimes(2);
  });
});
