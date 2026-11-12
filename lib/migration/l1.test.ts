import { hashTypedData, type Hex, keccak256, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import {
  fetchL1Leftovers,
  L1_MIGRATOR,
  migrationTypedData,
  signatureIsFrom,
  typedDataForCli,
  withHeadroom,
} from "./l1";

// A throwaway key, only for signing in tests.
const signer = privateKeyToAccount(
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
);
const account = signer.address.toLowerCase() as Hex;

describe("migrationTypedData", () => {
  it("names the types exactly as the L1Migrator hashes them", () => {
    // The contract's type strings (L1Migrator.sol): any difference and
    // every signature fails on-chain.
    const typeHash = (s: string) => keccak256(toBytes(s));
    const encodeType = (kind: "orchestrator" | "locks" | "sender") => {
      const t = migrationTypedData(kind, account, [1n]);
      const fields = (
        t.types as Record<string, readonly { name: string; type: string }[]>
      )[t.primaryType];
      return `${t.primaryType}(${fields
        .map((f) => `${f.type} ${f.name}`)
        .join(",")})`;
    };
    expect(typeHash(encodeType("orchestrator"))).toBe(
      typeHash("MigrateDelegator(address l1Addr,address l2Addr)")
    );
    expect(typeHash(encodeType("sender"))).toBe(
      typeHash("MigrateSender(address l1Addr,address l2Addr)")
    );
    expect(typeHash(encodeType("locks"))).toBe(
      typeHash(
        "MigrateUnbondingLocks(address l1Addr,address l2Addr,uint256[] unbondingLockIds)"
      )
    );
  });

  it("is for the current L1Migrator on Ethereum, migrating to the same address", () => {
    const t = migrationTypedData("orchestrator", account);
    expect(t.domain).toEqual({
      name: "Livepeer L1Migrator",
      version: "1",
      chainId: 1,
      verifyingContract: L1_MIGRATOR,
    });
    expect(t.message).toEqual({ l1Addr: account, l2Addr: account });
  });
});

describe("typedDataForCli", () => {
  it("is complete typed data, with lock ids as strings", () => {
    const json = JSON.parse(typedDataForCli("locks", account, [0n, 3n]));
    expect(json.primaryType).toBe("MigrateUnbondingLocks");
    expect(json.types.EIP712Domain).toHaveLength(4);
    expect(json.message.unbondingLockIds).toEqual(["0", "3"]);
    // Hashes to the same thing the contract checks.
    const t = migrationTypedData("locks", account, [0n, 3n]);
    expect(
      hashTypedData({
        ...json,
        message: { ...json.message, unbondingLockIds: [0n, 3n] },
      })
    ).toBe(hashTypedData(t as Parameters<typeof hashTypedData>[0]));
  });
});

describe("signatureIsFrom", () => {
  const sign = (
    kind: "orchestrator" | "locks" | "sender",
    ids: bigint[] = []
  ) =>
    signer.signTypedData(
      migrationTypedData(kind, account, ids) as Parameters<
        typeof signer.signTypedData
      >[0]
    );

  it("accepts the address's own signature for this migration", async () => {
    expect(
      await signatureIsFrom(
        "orchestrator",
        account,
        [],
        await sign("orchestrator")
      )
    ).toBe(true);
    expect(
      await signatureIsFrom("locks", account, [2n], await sign("locks", [2n]))
    ).toBe(true);
  });

  it("refuses one for another migration, other locks, or another address", async () => {
    const sig = await sign("locks", [2n]);
    expect(await signatureIsFrom("locks", account, [2n, 5n], sig)).toBe(false);
    expect(
      await signatureIsFrom("sender", account, [], await sign("orchestrator"))
    ).toBe(false);
    const other = "0x000000000000000000000000000000000000dead" as Hex;
    expect(
      await signatureIsFrom(
        "orchestrator",
        other,
        [],
        await sign("orchestrator")
      )
    ).toBe(false);
    expect(await signatureIsFrom("orchestrator", account, [], "0x1234")).toBe(
      false
    );
  });
});

describe("withHeadroom", () => {
  it("pads gas and price, and sends exactly what the message can spend", () => {
    const fee = withHeadroom({
      gas: 1_000_000n,
      l2GasPrice: 10_000_000n,
      submissionFee: 5_000n,
    });
    expect(fee.maxGas).toBe(1_300_000n);
    expect(fee.gasPriceBid).toBe(30_000_000n);
    expect(fee.value).toBe(5_000n + 1_300_000n * 30_000_000n);
  });

  it("never asks for less than 100k gas", () => {
    expect(
      withHeadroom({ gas: 10n, l2GasPrice: 1n, submissionFee: 0n }).maxGas
    ).toBe(100_000n);
  });
});

describe("fetchL1Leftovers", () => {
  const orch = "0x00000000000000000000000000000000000000bb";
  /** Answers each multicall in turn: Ethereum's reads, then Arbitrum's. */
  const clients = (l1Answers: unknown[][], l2Answers: boolean[][]) => {
    const l1 = { multicall: jest.fn(), readContract: jest.fn() };
    l1Answers.forEach((a) => l1.multicall.mockResolvedValueOnce(a));
    const l2 = { multicall: jest.fn() };
    l2Answers.forEach((a) => l2.multicall.mockResolvedValueOnce(a));
    return { l1, l2 };
  };
  const senderInfo = (deposit: bigint, reserve: bigint) => [
    { deposit, withdrawRound: 0n },
    { fundsRemaining: reserve, claimedInCurrentRound: 0n },
  ];

  it("finds an orchestrator's stake, open locks and a broadcaster's funds", async () => {
    const { l1, l2 } = clients(
      [
        [[10n, 0n, account, 50n, 0n, 0n, 3n], senderInfo(2n, 3n)],
        [
          [5n, 0n],
          [0n, 0n],
          [7n, 0n],
        ],
      ],
      // Not migrated: delegator and sender; of locks 0 and 2, lock 2 is.
      [
        [false, false],
        [false, true],
      ]
    );
    const out = await fetchL1Leftovers(l1 as never, l2 as never, account);
    expect(out.orchestrator).toEqual({ delegated: 50n, own: 10n });
    // Lock 1 is empty, lock 2 already migrated: only lock 0 is left.
    expect(out.locks).toEqual({ ids: [0n], total: 5n, delegate: account });
    expect(out.sender).toEqual({ deposit: 2n, reserve: 3n });
  });

  it("leaves out delegated stake and anything already migrated", async () => {
    const { l1, l2 } = clients(
      [[[10n, 0n, orch, 0n, 0n, 0n, 0n], senderInfo(1n, 0n)]],
      [[false, true]]
    );
    const out = await fetchL1Leftovers(l1 as never, l2 as never, account);
    // Delegated to someone else: the snapshot claim covers it.
    expect(out.orchestrator).toBeNull();
    expect(out.locks).toBeNull();
    // Already migrated.
    expect(out.sender).toBeNull();
  });
});
