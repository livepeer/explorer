import {
  encodeFunctionData,
  type Hex,
  parseEther,
  parseGwei,
  type PublicClient,
  recoverTypedDataAddress,
} from "viem";

import { L1_CHAIN, L2_MIGRATOR } from "@/lib/config";

/*
 * What an address can still move from Ethereum to Arbitrum through
 * Livepeer's L1Migrator (LIP-73), besides the delegated stake that's claimed
 * on Arbitrum (claim.ts): an orchestrator's own stake and fees, undelegated
 * stake still unbonding when Ethereum's protocol was paused, and a
 * broadcaster's deposit and reserve. Ethereum's protocol contracts are
 * paused, so migrating is the only way any of it moves.
 *
 * Each migration is one Ethereum transaction to the L1Migrator, which sends
 * a message to the L2Migrator on Arbitrum (a retryable ticket, paid for in
 * ETH with the transaction). It always lands at the same address: the
 * contract refuses any other, so the same key controls it on both sides.
 */

/**
 * The L1Migrator on Ethereum, redeployed in 2025 for Arbitrum's current
 * fees (livepeer/explorer#684). It reports L2_MIGRATOR as its counterpart,
 * and the protocol contracts below as the ones it reads.
 */
export const L1_MIGRATOR: Hex = "0x2a69191B43c9DB47C927bD7287F9C93838d07759";
/** Livepeer's BondingManager and TicketBroker on Ethereum, now paused. */
export const L1_BONDING_MANAGER: Hex =
  "0x511Bc4556D823Ae99630aE8de28b9B80Df90eA2e";
export const L1_TICKET_BROKER: Hex =
  "0x5b1cE829384EeBFa30286F12d1E7A695ca45F5D2";
/** Arbitrum's Inbox on Ethereum, and its NodeInterface on Arbitrum. */
const ARB_INBOX: Hex = "0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f";
const NODE_INTERFACE: Hex = "0x00000000000000000000000000000000000000C8";

const delegatorParams = {
  type: "tuple",
  name: "params",
  components: [
    { name: "l1Addr", type: "address" },
    { name: "l2Addr", type: "address" },
    { name: "stake", type: "uint256" },
    { name: "delegatedStake", type: "uint256" },
    { name: "fees", type: "uint256" },
    { name: "delegate", type: "address" },
  ],
} as const;
const locksParams = {
  type: "tuple",
  name: "params",
  components: [
    { name: "l1Addr", type: "address" },
    { name: "l2Addr", type: "address" },
    { name: "total", type: "uint256" },
    { name: "unbondingLockIds", type: "uint256[]" },
    { name: "delegate", type: "address" },
  ],
} as const;
const senderParams = {
  type: "tuple",
  name: "params",
  components: [
    { name: "l1Addr", type: "address" },
    { name: "l2Addr", type: "address" },
    { name: "deposit", type: "uint256" },
    { name: "reserve", type: "uint256" },
  ],
} as const;
const fee = [
  { name: "_maxGas", type: "uint256" },
  { name: "_gasPriceBid", type: "uint256" },
  { name: "_maxSubmissionCost", type: "uint256" },
] as const;

export const l1MigratorAbi = [
  {
    type: "function",
    name: "getMigrateDelegatorParams",
    stateMutability: "view",
    inputs: [
      { name: "_l1Addr", type: "address" },
      { name: "_l2Addr", type: "address" },
    ],
    outputs: [{ name: "data", type: "bytes" }, delegatorParams],
  },
  {
    type: "function",
    name: "getMigrateUnbondingLocksParams",
    stateMutability: "view",
    inputs: [
      { name: "_l1Addr", type: "address" },
      { name: "_l2Addr", type: "address" },
      { name: "_unbondingLockIds", type: "uint256[]" },
    ],
    outputs: [{ name: "data", type: "bytes" }, locksParams],
  },
  {
    type: "function",
    name: "getMigrateSenderParams",
    stateMutability: "view",
    inputs: [
      { name: "_l1Addr", type: "address" },
      { name: "_l2Addr", type: "address" },
    ],
    outputs: [{ name: "data", type: "bytes" }, senderParams],
  },
  {
    type: "function",
    name: "migrateDelegator",
    stateMutability: "payable",
    inputs: [
      { name: "_l1Addr", type: "address" },
      { name: "_l2Addr", type: "address" },
      { name: "_sig", type: "bytes" },
      ...fee,
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "migrateUnbondingLocks",
    stateMutability: "payable",
    inputs: [
      { name: "_l1Addr", type: "address" },
      { name: "_l2Addr", type: "address" },
      { name: "_unbondingLockIds", type: "uint256[]" },
      { name: "_sig", type: "bytes" },
      ...fee,
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "migrateSender",
    stateMutability: "payable",
    inputs: [
      { name: "_l1Addr", type: "address" },
      { name: "_l2Addr", type: "address" },
      { name: "_sig", type: "bytes" },
      ...fee,
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "bool" }],
  },
] as const;

export const l1BondingManagerAbi = [
  {
    type: "function",
    name: "getDelegator",
    stateMutability: "view",
    inputs: [{ name: "_delegator", type: "address" }],
    outputs: [
      { name: "bondedAmount", type: "uint256" },
      { name: "fees", type: "uint256" },
      { name: "delegateAddress", type: "address" },
      { name: "delegatedAmount", type: "uint256" },
      { name: "startRound", type: "uint256" },
      { name: "lastClaimRound", type: "uint256" },
      { name: "nextUnbondingLockId", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "getDelegatorUnbondingLock",
    stateMutability: "view",
    inputs: [
      { name: "_delegator", type: "address" },
      { name: "_unbondingLockId", type: "uint256" },
    ],
    outputs: [
      { name: "amount", type: "uint256" },
      { name: "withdrawRound", type: "uint256" },
    ],
  },
] as const;

export const l1TicketBrokerAbi = [
  {
    type: "function",
    name: "getSenderInfo",
    stateMutability: "view",
    inputs: [{ name: "_sender", type: "address" }],
    outputs: [
      {
        name: "sender",
        type: "tuple",
        components: [
          { name: "deposit", type: "uint256" },
          { name: "withdrawRound", type: "uint256" },
        ],
      },
      {
        name: "reserve",
        type: "tuple",
        components: [
          { name: "fundsRemaining", type: "uint256" },
          { name: "claimedInCurrentRound", type: "uint256" },
        ],
      },
    ],
  },
] as const;

/** What the L2Migrator records once each migration lands on Arbitrum. */
export const l2MigratedAbi = [
  {
    type: "function",
    name: "migratedDelegators",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "migratedUnbondingLocks",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
  {
    type: "function",
    name: "migratedSenders",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const inboxAbi = [
  {
    type: "function",
    name: "calculateRetryableSubmissionFee",
    stateMutability: "view",
    inputs: [
      { name: "dataLength", type: "uint256" },
      { name: "baseFee", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

const estimateRetryableTicketAbi = [
  {
    type: "function",
    name: "estimateRetryableTicket",
    stateMutability: "nonpayable",
    inputs: [
      { name: "sender", type: "address" },
      { name: "deposit", type: "uint256" },
      { name: "to", type: "address" },
      { name: "l2CallValue", type: "uint256" },
      { name: "excessFeeRefundAddress", type: "address" },
      { name: "callValueRefundAddress", type: "address" },
      { name: "data", type: "bytes" },
    ],
    outputs: [],
  },
] as const;

/* ── What's left on Ethereum ─────────────────────────────────────────── */

export type MigrationKind = "orchestrator" | "locks" | "sender";

export type L1Leftovers = {
  account: string;
  /** Its own stake and fees, for an orchestrator that never migrated. */
  orchestrator: {
    /** Stake delegated to it in all, its own included. */
    delegated: bigint;
    own: bigint;
  } | null;
  /** Undelegated stake still unbonding when Ethereum was paused. */
  locks: {
    ids: bigint[];
    total: bigint;
    /** Where the stake lands delegated on Arbitrum: its old orchestrator. */
    delegate: string;
  } | null;
  /** A broadcaster's deposit and reserve, in wei. */
  sender: { deposit: bigint; reserve: bigint } | null;
};

export const hasLeftovers = (l: L1Leftovers | null | undefined) =>
  Boolean(l && (l.orchestrator || l.locks || l.sender));

type Reader = Pick<PublicClient, "readContract" | "multicall">;

/**
 * What an address still has on Ethereum that only migrating moves, leaving
 * out anything Arbitrum already shows as migrated. Delegated stake isn't
 * here: it's in the migration snapshot and claimed on Arbitrum.
 */
export async function fetchL1Leftovers(
  l1: Reader,
  l2: Pick<PublicClient, "multicall">,
  address: string
): Promise<L1Leftovers> {
  const account = address.toLowerCase() as Hex;
  const [delegator, senderInfo] = await l1.multicall({
    allowFailure: false,
    contracts: [
      {
        address: L1_BONDING_MANAGER,
        abi: l1BondingManagerAbi,
        functionName: "getDelegator",
        args: [account],
      },
      {
        address: L1_TICKET_BROKER,
        abi: l1TicketBrokerAbi,
        functionName: "getSenderInfo",
        args: [account],
      },
    ],
  });
  const [bonded, , delegateAddress, delegatedAmount, , , nextLockId] =
    delegator;
  const delegate = delegateAddress.toLowerCase();
  const isOrchestrator = delegate === account && bonded > 0n;
  const deposit = senderInfo[0].deposit;
  const reserve = senderInfo[1].fundsRemaining;

  // Every unbonding lock still holding LPT on Ethereum.
  const lockIds = Array.from({ length: Number(nextLockId) }, (_, i) =>
    BigInt(i)
  );
  const lockAmounts = (
    lockIds.length
      ? await l1.multicall({
          allowFailure: false,
          contracts: lockIds.map((id) => ({
            address: L1_BONDING_MANAGER,
            abi: l1BondingManagerAbi,
            functionName: "getDelegatorUnbondingLock" as const,
            args: [account, id] as const,
          })),
        })
      : []
  ) as (readonly [bigint, bigint])[];
  const openLocks = lockIds.filter((_, i) => lockAmounts[i][0] > 0n);

  // And which of them Arbitrum already has.
  const [[delegatorMigrated, senderMigrated], locksMigrated] =
    await Promise.all([
      l2.multicall({
        allowFailure: false,
        contracts: [
          {
            address: L2_MIGRATOR,
            abi: l2MigratedAbi,
            functionName: "migratedDelegators",
            args: [account],
          },
          {
            address: L2_MIGRATOR,
            abi: l2MigratedAbi,
            functionName: "migratedSenders",
            args: [account],
          },
        ],
      }),
      openLocks.length
        ? (l2.multicall({
            allowFailure: false,
            contracts: openLocks.map((id) => ({
              address: L2_MIGRATOR as Hex,
              abi: l2MigratedAbi,
              functionName: "migratedUnbondingLocks" as const,
              args: [account, id] as const,
            })),
          }) as Promise<boolean[]>)
        : Promise.resolve([] as boolean[]),
    ]);
  const ids = openLocks.filter((_, i) => !locksMigrated[i]);
  const total = ids.reduce((s, id) => s + lockAmounts[Number(id)][0], 0n);

  return {
    account,
    orchestrator:
      isOrchestrator && !delegatorMigrated
        ? { delegated: delegatedAmount, own: bonded }
        : null,
    locks: ids.length && total > 0n ? { ids, total, delegate } : null,
    sender:
      !senderMigrated && (deposit > 0n || reserve > 0n)
        ? { deposit, reserve }
        : null,
  };
}

/* ── The migration itself ────────────────────────────────────────────── */

/** Everything a migration needs, as the L1Migrator itself computes it. */
export type MigrationPlan =
  | {
      kind: "orchestrator";
      data: Hex;
      stake: bigint;
      delegatedStake: bigint;
      fees: bigint;
    }
  | {
      kind: "locks";
      data: Hex;
      total: bigint;
      ids: readonly bigint[];
      delegate: string;
    }
  | { kind: "sender"; data: Hex; deposit: bigint; reserve: bigint };

/** The L1Migrator's own figures and Arbitrum calldata for a migration. */
export async function planMigration(
  l1: Pick<PublicClient, "readContract">,
  kind: MigrationKind,
  account: Hex,
  lockIds: readonly bigint[] = []
): Promise<MigrationPlan> {
  if (kind === "orchestrator") {
    const [data, p] = await l1.readContract({
      address: L1_MIGRATOR,
      abi: l1MigratorAbi,
      functionName: "getMigrateDelegatorParams",
      args: [account, account],
    });
    return {
      kind,
      data,
      stake: p.stake,
      delegatedStake: p.delegatedStake,
      fees: p.fees,
    };
  }
  if (kind === "locks") {
    const [data, p] = await l1.readContract({
      address: L1_MIGRATOR,
      abi: l1MigratorAbi,
      functionName: "getMigrateUnbondingLocksParams",
      args: [account, account, [...lockIds]],
    });
    return {
      kind,
      data,
      total: p.total,
      ids: p.unbondingLockIds,
      delegate: p.delegate.toLowerCase(),
    };
  }
  const [data, p] = await l1.readContract({
    address: L1_MIGRATOR,
    abi: l1MigratorAbi,
    functionName: "getMigrateSenderParams",
    args: [account, account],
  });
  return { kind, data, deposit: p.deposit, reserve: p.reserve };
}

/**
 * What the migration pays for its message on Arbitrum, sent as ETH with it.
 * Maximums with headroom; Arbitrum refunds what isn't used to the address
 * being migrated.
 */
export type MigrationFee = {
  maxGas: bigint;
  gasPriceBid: bigint;
  maxSubmissionCost: bigint;
  value: bigint;
};

/** No migration message should cost more than this; above it, pricing is off. */
export const MAX_MIGRATION_VALUE = parseEther("0.02");

/**
 * The headroom, as for a bridge deposit: 30% more gas than estimated (at
 * least 100k), 3× today's Arbitrum gas price, and a submission fee priced at
 * 4× Ethereum's base fee or 5 gwei, whichever is higher.
 */
export function withHeadroom({
  gas,
  l2GasPrice,
  submissionFee,
}: {
  gas: bigint;
  l2GasPrice: bigint;
  submissionFee: bigint;
}): MigrationFee {
  const minGas = 100_000n;
  const maxGas = (gas * 13n) / 10n > minGas ? (gas * 13n) / 10n : minGas;
  const gasPriceBid = l2GasPrice * 3n;
  return {
    maxGas,
    gasPriceBid,
    maxSubmissionCost: submissionFee,
    value: submissionFee + maxGas * gasPriceBid,
  };
}

const submissionBaseFee = (baseFee: bigint) => {
  const floor = parseGwei("5");
  return baseFee * 4n > floor ? baseFee * 4n : floor;
};

/** Arbitrum would refuse this migration: nothing is sent. */
export class MigrationRejected extends Error {
  constructor() {
    super(
      "Arbitrum would reject this migration right now, so nothing was sent. It may already be on its way: check again in a few minutes."
    );
    this.name = "MigrationRejected";
  }
}

/**
 * Prices a migration's message, and in doing so runs it: Arbitrum's
 * NodeInterface simulates the exact call the L2Migrator will receive, so a
 * migration Arbitrum would refuse (already migrated, say) is caught here,
 * before any ETH is spent on Ethereum.
 */
export async function priceMigration(
  l1: Pick<PublicClient, "readContract" | "getBlock">,
  l2: Pick<PublicClient, "estimateGas" | "getGasPrice">,
  { data, account }: { data: Hex; account: Hex }
): Promise<MigrationFee> {
  const [gas, l2GasPrice, block] = await Promise.all([
    l2
      .estimateGas({
        to: NODE_INTERFACE,
        data: encodeFunctionData({
          abi: estimateRetryableTicketAbi,
          functionName: "estimateRetryableTicket",
          // NodeInterface aliases the sender itself: the plain L1Migrator.
          args: [
            L1_MIGRATOR,
            parseEther("1"),
            L2_MIGRATOR,
            0n,
            account,
            account,
            data,
          ],
        }),
      })
      .catch(() => {
        throw new MigrationRejected();
      }),
    l2.getGasPrice(),
    l1.getBlock(),
  ]);
  const submissionFee = await l1.readContract({
    address: ARB_INBOX,
    abi: inboxAbi,
    functionName: "calculateRetryableSubmissionFee",
    args: [
      BigInt((data.length - 2) / 2),
      submissionBaseFee(block.baseFeePerGas ?? 0n),
    ],
  });
  const fee = withHeadroom({ gas, l2GasPrice, submissionFee });
  if (fee.value > MAX_MIGRATION_VALUE) {
    throw new Error(
      "Arbitrum's fees look unusually high right now. Try again in a bit."
    );
  }
  return fee;
}

/** The transaction to the L1Migrator for a migration. */
export function migrationCall(
  plan: MigrationPlan,
  account: Hex,
  sig: Hex,
  fee: MigrationFee
) {
  const tail = [fee.maxGas, fee.gasPriceBid, fee.maxSubmissionCost] as const;
  const base = {
    address: L1_MIGRATOR,
    abi: l1MigratorAbi,
    value: fee.value,
    chainId: L1_CHAIN.id,
  } as const;
  if (plan.kind === "orchestrator") {
    return {
      ...base,
      functionName: "migrateDelegator",
      args: [account, account, sig, ...tail],
    } as const;
  }
  if (plan.kind === "locks") {
    return {
      ...base,
      functionName: "migrateUnbondingLocks",
      args: [account, account, [...plan.ids], sig, ...tail],
    } as const;
  }
  return {
    ...base,
    functionName: "migrateSender",
    args: [account, account, sig, ...tail],
  } as const;
}

/* ── Signing for an address you can't connect ───────────────────────── */

/**
 * The L1Migrator lets anyone send a migration that the address being
 * migrated has signed (EIP-712). Orchestrators' keys usually live in their
 * node, so they sign with livepeer_cli ("Sign typed data") and paste the
 * signature here; any wallet then sends it and pays.
 */
export function migrationTypedData(
  kind: MigrationKind,
  account: Hex,
  lockIds: readonly bigint[] = []
) {
  const domain = {
    name: "Livepeer L1Migrator",
    version: "1",
    chainId: L1_CHAIN.id,
    verifyingContract: L1_MIGRATOR,
  } as const;
  const addrs = [
    { name: "l1Addr", type: "address" },
    { name: "l2Addr", type: "address" },
  ] as const;
  if (kind === "locks") {
    return {
      domain,
      primaryType: "MigrateUnbondingLocks",
      types: {
        MigrateUnbondingLocks: [
          ...addrs,
          { name: "unbondingLockIds", type: "uint256[]" },
        ],
      },
      message: { l1Addr: account, l2Addr: account, unbondingLockIds: lockIds },
    } as const;
  }
  const primaryType =
    kind === "orchestrator" ? "MigrateDelegator" : "MigrateSender";
  return {
    domain,
    primaryType,
    types: { [primaryType]: addrs },
    message: { l1Addr: account, l2Addr: account },
  } as const;
}

/**
 * The message as livepeer_cli takes it: the full typed-data JSON, with the
 * domain's own type spelled out and numbers as strings.
 */
export function typedDataForCli(
  kind: MigrationKind,
  account: Hex,
  lockIds: readonly bigint[] = []
) {
  const t = migrationTypedData(kind, account, lockIds);
  return JSON.stringify({
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      ...t.types,
    },
    domain: t.domain,
    primaryType: t.primaryType,
    message: Object.fromEntries(
      Object.entries(t.message).map(([k, v]) => [
        k,
        Array.isArray(v) ? v.map(String) : v,
      ])
    ),
  });
}

/** Whether a pasted signature was made by `account` for this migration. */
export async function signatureIsFrom(
  kind: MigrationKind,
  account: Hex,
  lockIds: readonly bigint[],
  signature: string
) {
  if (!/^0x[0-9a-fA-F]{130}$/.test(signature.trim())) return false;
  try {
    const signer = await recoverTypedDataAddress({
      ...migrationTypedData(kind, account, lockIds),
      signature: signature.trim() as Hex,
    } as unknown as Parameters<typeof recoverTypedDataAddress>[0]);
    return signer.toLowerCase() === account.toLowerCase();
  } catch {
    return false;
  }
}

/* ── On its way ──────────────────────────────────────────────────────── */

/** Arbitrum's page for a message from Ethereum: where to retry a stuck one. */
export const retryableUrl = (l1Tx: string) =>
  `https://retryable-dashboard.arbitrum.io/tx/${l1Tx}`;

/** About how long a message from Ethereum takes to land on Arbitrum. */
export const ARRIVAL_MINUTES = 15;

export type SentMigration = {
  account: string;
  kind: MigrationKind;
  l1Tx: Hex;
  /** Unix seconds. */
  sentAt: number;
};

const KEY = "livepeer-explorer.l1-migrations-sent";
const listeners = new Set<() => void>();

export function readSentMigrations(): SentMigration[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * Remembered for a day, so the page shows "on its way" rather than another
 * Migrate button while Arbitrum catches up: a second message would only be
 * refused there, its fee wasted.
 */
export function addSentMigration(m: SentMigration) {
  const now = Math.floor(Date.now() / 1000);
  const list = readSentMigrations().filter(
    (x) =>
      now - x.sentAt < 86_400 && !(x.account === m.account && x.kind === m.kind)
  );
  try {
    localStorage.setItem(KEY, JSON.stringify([...list, m]));
  } catch {
    // Private mode: it just won't survive a reload.
  }
  listeners.forEach((l) => l());
}

export function subscribeSentMigrations(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => e.key === KEY && l();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}
