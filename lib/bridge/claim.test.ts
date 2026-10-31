import { encodeFunctionData } from "viem";

import { checkClaim } from "./claim";
import fixture from "./claim.fixture.json";
import { finalizeInboundTransferAbi, L1_LPT } from "./config";
import type { ClaimArgs } from "./types";

// A real claim the API built for withdrawal 1669: 1 LPT to 0x5254…cb0e,
// made in Sep 2022 and still unclaimed.
const args = fixture.args as ClaimArgs;
const withdrawal = {
  id: "1669",
  from: "0x525419ff5707190389bfb5c87c375d710f5fcb0e",
  to: "0x525419ff5707190389bfb5c87c375d710f5fcb0e",
  amount: "1000000000000000000",
  block: "24062412",
  timestamp: 1662890282,
  tx: "0x0ee3313da474925ec27571a5203c17df3f2606a6843a88f4cbbcbbf6e07eaaef",
};

const payout = (to: `0x${string}`, amount: bigint, token = L1_LPT) =>
  encodeFunctionData({
    abi: finalizeInboundTransferAbi,
    functionName: "finalizeInboundTransfer",
    args: [token as `0x${string}`, to, to, amount, "0x"],
  });

describe("checkClaim", () => {
  it("accepts the real claim for its withdrawal", () => {
    const call = checkClaim(args, withdrawal);
    expect(call[1]).toBe(1669n);
    expect(call[0]).toHaveLength(18);
  });

  it("refuses a payout to someone else", () => {
    const bad = {
      ...args,
      data: payout("0x000000000000000000000000000000000000dEaD", 10n ** 18n),
    };
    expect(() => checkClaim(bad, withdrawal)).toThrow("recipient");
  });

  it("refuses the wrong amount or token", () => {
    const to = withdrawal.to as `0x${string}`;
    expect(() =>
      checkClaim({ ...args, data: payout(to, 2n * 10n ** 18n) }, withdrawal)
    ).toThrow("amount");
    expect(() =>
      checkClaim(
        {
          ...args,
          data: payout(
            to,
            10n ** 18n,
            "0x0000000000000000000000000000000000000001"
          ),
        },
        withdrawal
      )
    ).toThrow("token");
  });

  it("refuses other gateways, ETH, or another message", () => {
    const other = "0x0000000000000000000000000000000000000001";
    expect(() => checkClaim({ ...args, to: other }, withdrawal)).toThrow(
      "gateway"
    );
    expect(() => checkClaim({ ...args, l2Sender: other }, withdrawal)).toThrow(
      "sender"
    );
    expect(() => checkClaim({ ...args, value: "1" }, withdrawal)).toThrow(
      "ETH"
    );
    expect(() => checkClaim({ ...args, index: "1670" }, withdrawal)).toThrow(
      "message number"
    );
  });

  it("refuses data that isn't an LPT payout", () => {
    expect(() =>
      checkClaim({ ...args, data: "0xdeadbeef" }, withdrawal)
    ).toThrow("payout");
  });
});
