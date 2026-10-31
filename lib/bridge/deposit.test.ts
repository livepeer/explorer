import { decodeAbiParameters, parseGwei } from "viem";

import { MAX_DEPOSIT_VALUE, submissionBaseFee, withHeadroom } from "./deposit";

describe("withHeadroom", () => {
  // From a dry run against mainnet: 78,547 gas at 0.02 gwei on Arbitrum.
  const p = withHeadroom({
    gas: 78_547n,
    l2GasPrice: parseGwei("0.02"),
    submissionFee: 928_331_812_672n,
  });

  it("pads gas to the 100k floor and bids 3× the gas price", () => {
    expect(p.maxGas).toBe(102_111n);
    expect(p.gasPriceBid).toBe(parseGwei("0.06"));
  });

  it("sends exactly the submission fee plus the gas budget", () => {
    expect(p.value).toBe(p.maxSubmissionCost + p.maxGas * p.gasPriceBid);
    expect(p.value).toBeLessThan(MAX_DEPOSIT_VALUE);
  });

  it("encodes the submission fee for the gateway", () => {
    const [fee, extra] = decodeAbiParameters(
      [{ type: "uint256" }, { type: "bytes" }],
      p.data
    );
    expect(fee).toBe(p.maxSubmissionCost);
    expect(extra).toBe("0x");
  });

  it("never goes below the 100k gas floor", () => {
    expect(
      withHeadroom({ gas: 1n, l2GasPrice: 1n, submissionFee: 0n }).maxGas
    ).toBe(100_000n);
  });
});

describe("submissionBaseFee", () => {
  it("is 4× the base fee, at least 5 gwei", () => {
    expect(submissionBaseFee(parseGwei("0.3"))).toBe(parseGwei("5"));
    expect(submissionBaseFee(parseGwei("10"))).toBe(parseGwei("40"));
  });
});
