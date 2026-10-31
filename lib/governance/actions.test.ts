import { encodeFunctionData, getAddress } from "viem";

import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { PROTOCOL_CONTRACTS } from "@/lib/config";

import { decodeProposalActions, requestedLpt } from "./actions";

const TOKEN = PROTOCOL_CONTRACTS.LivepeerToken.toLowerCase();
const RECIPIENT = "0x7cfc770b22135e8d2fe483a58e33fb134ee70466";
const OTHER = "0x1111111111111111111111111111111111111111";

const transfer = (to: string, wei: bigint) =>
  encodeFunctionData({
    abi: livepeerToken,
    functionName: "transfer",
    args: [to as `0x${string}`, wei],
  });

describe("decodeProposalActions", () => {
  it("reads a transfer on the LPT token as a request for LPT", () => {
    // The calldata of a real proposal: 9,335 LPT to LiveInfra SPE.
    const data =
      "0xa9059cbb0000000000000000000000007cfc770b22135e8d2fe483a58e33fb134ee704660000000000000000000000000000000000000000000001fa0d26310cdf7c0000";
    const [action] = decodeProposalActions([TOKEN], ["0"], [data]);
    expect(action.kind).toBe("lptTransfer");
    if (action.kind !== "lptTransfer") return;
    expect(action.to).toBe(RECIPIENT);
    expect(action.amount).toBe(9335);
  });

  it("keeps the same call on another contract as a plain call", () => {
    const [action] = decodeProposalActions(
      [OTHER],
      ["0"],
      [transfer(RECIPIENT, 10n ** 18n)]
    );
    expect(action).toMatchObject({
      kind: "call",
      target: OTHER,
      value: 0,
      selector: "0xa9059cbb",
      // An unknown contract: the full calldata, not a guess at its meaning.
      contract: null,
      decoded: null,
    });
    if (action.kind === "call") expect(action.data.length).toBe(138);
  });

  it("keeps a token call that sends ETH, or isn't a transfer, as a plain call", () => {
    const withEth = decodeProposalActions(
      [TOKEN],
      [String(10n ** 18n)],
      [transfer(RECIPIENT, 1n)]
    )[0];
    expect(withEth).toMatchObject({ kind: "call", value: 1 });
    const approve = encodeFunctionData({
      abi: livepeerToken,
      functionName: "approve",
      args: [RECIPIENT as `0x${string}`, 1n],
    });
    expect(decodeProposalActions([TOKEN], ["0"], [approve])[0].kind).toBe(
      "call"
    );
  });

  it("doesn't throw on malformed data", () => {
    const [a, b] = decodeProposalActions(
      [TOKEN, OTHER],
      ["nope", "0"],
      ["0xdeadbeef00", "0x"]
    );
    expect(a.kind).toBe("call");
    expect(b).toMatchObject({ kind: "call", selector: null });
  });
});

describe("decoded calls", () => {
  it("reads a protocol contract's call in full: function and exact arguments", () => {
    const approve = encodeFunctionData({
      abi: livepeerToken,
      functionName: "approve",
      args: [RECIPIENT as `0x${string}`, 123456789012345678901n],
    });
    const [action] = decodeProposalActions([TOKEN], ["0"], [approve]);
    expect(action).toMatchObject({
      kind: "call",
      contract: "LivepeerToken",
      decoded: {
        functionName: "approve",
        args: [getAddress(RECIPIENT), "123456789012345678901"],
      },
    });
  });
});

describe("requestedLpt", () => {
  it("totals transfers and lists each recipient once", () => {
    const actions = decodeProposalActions(
      [TOKEN, TOKEN, TOKEN],
      ["0", "0", "0"],
      [
        transfer(RECIPIENT, 10n ** 18n),
        transfer(OTHER, 2n * 10n ** 18n),
        transfer(RECIPIENT, 10n ** 18n),
      ]
    );
    expect(requestedLpt(actions)).toEqual({
      amount: 4,
      recipients: [RECIPIENT, OTHER],
    });
  });

  it("is null when a proposal does anything besides transfer LPT", () => {
    const actions = decodeProposalActions(
      [TOKEN, OTHER],
      ["0", "0"],
      [transfer(RECIPIENT, 10n ** 18n), "0x12345678"]
    );
    expect(requestedLpt(actions)).toBeNull();
    expect(requestedLpt([])).toBeNull();
  });
});
