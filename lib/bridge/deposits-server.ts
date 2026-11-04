import {
  BaseError,
  ContractFunctionRevertedError,
  type Hex,
  isAddressEqual,
  parseAbiItem,
  parseEventLogs,
  TransactionReceiptNotFoundError,
} from "viem";

import { L1_LPT, L1_LPT_GATEWAY } from "./config";
import {
  ARB_RETRYABLE_TX,
  arbRetryableTxAbi,
  redeemScheduled,
  ticketFromLogs,
} from "./tickets";
import type { TrackedDeposit } from "./types";
import { l1, l2 } from "./withdrawals-server";

/*
 * LPT deposits from Ethereum to Arbitrum, found from the Ethereum gateway's
 * events (so they show on any device, not just the browser that sent them)
 * and each one's state read from its Arbitrum ticket (see tickets.ts).
 */

/**
 * How far back to look. A ticket lasts 7 days from its creation on
 * Arbitrum, which comes minutes (rarely hours) after Ethereum's send; the
 * extra day covers that delay, so a deposit waiting for a retry stays
 * listed until its ticket's own deadline (`retryBy`, read from Arbitrum)
 * rather than 7 days from the send. Anything older has either arrived or
 * expired, and there's nothing left to act on.
 */
const WINDOW_SECONDS = 8 * 86_400;
/** Ethereum makes a block every 12s; a few extra cover any slow ones. */
const WINDOW_BLOCKS = BigInt(WINDOW_SECONDS / 12 + 600);
/** Keyed RPCs search logs at most 10k blocks at a time. */
const CHUNK = 10_000n;

const depositInitiated = parseAbiItem(
  "event DepositInitiated(address l1Token, address indexed _from, address indexed _to, uint256 indexed _sequenceNumber, uint256 _amount)"
);

/**
 * Recent blocks can still be replaced (a reorg), so each scan reads the
 * last ones again and takes its own findings for them. Two epochs: past
 * that, Ethereum's blocks are final.
 */
const REORG_DEPTH = 64n;

/**
 * A deposit as scanned: with its block, to know which ones a rescan covers,
 * and that block's hash, which its ticket depends on.
 */
type Sent = Omit<TrackedDeposit, "status" | "retryBy"> & {
  block: bigint;
  blockHash: Hex;
};

/**
 * The week's deposits, scanned once and then from shortly before where the
 * last scan stopped, at most every 15s, shared by every request on this
 * instance.
 */
let sent: Sent[] = [];
let scannedTo = 0n;
let scannedAt = 0;
let scanning: Promise<void> | null = null;

async function scan() {
  const latest = await l1.getBlockNumber();
  const floor = latest > WINDOW_BLOCKS ? latest - WINDOW_BLOCKS : 0n;
  const resume = scannedTo > REORG_DEPTH ? scannedTo + 1n - REORG_DEPTH : 0n;
  const start = scannedTo && resume > floor ? resume : floor;
  const found: Sent[] = [];
  for (let lo = start; lo <= latest; ) {
    const hi = lo + CHUNK - 1n < latest ? lo + CHUNK - 1n : latest;
    const logs = await l1.getLogs({
      address: L1_LPT_GATEWAY,
      event: depositInitiated,
      fromBlock: lo,
      toBlock: hi,
    });
    const times = new Map<bigint, number>();
    for (const b of new Set(logs.map((l) => l.blockNumber))) {
      times.set(b, Number((await l1.getBlock({ blockNumber: b })).timestamp));
    }
    for (const l of logs) {
      if (l.args.l1Token?.toLowerCase() !== L1_LPT.toLowerCase()) continue;
      found.push({
        l1Tx: l.transactionHash,
        from: l.args._from!.toLowerCase(),
        to: l.args._to!.toLowerCase(),
        amount: l.args._amount!.toString(),
        sentAt: times.get(l.blockNumber)!,
        seq: l.args._sequenceNumber!.toString(),
        block: l.blockNumber,
        blockHash: l.blockHash,
      });
    }
    lo = hi + 1n;
  }
  const cutoff = Date.now() / 1000 - WINDOW_SECONDS;
  // What this scan read again replaces what was there: a deposit in a
  // replaced block goes, and one in its replacement comes in.
  sent = [...sent.filter((d) => d.block < start), ...found].filter(
    (d) => d.sentAt >= cutoff
  );
  scannedTo = latest;
  scannedAt = Date.now();
}

async function refresh() {
  if (Date.now() - scannedAt < 15_000) return;
  scanning ??= scan().finally(() => (scanning = null));
  await scanning;
}

/** The transaction is now in another block than the one scanned. */
class Moved extends Error {}

/**
 * Each deposit's ticket id, fixed once its Ethereum transaction is in a
 * block. The id depends on that block (its base fee), so a reorg that puts
 * the same transaction in another block gives it another ticket: keyed by
 * block too, and only taken from a receipt in the block the scan saw. One
 * transaction can hold several deposits, each with its own ticket, hence
 * the message number.
 */
const tickets = new Map<string, Promise<Hex | null>>();
function ticketOf(l1Tx: Hex, seq: string, blockHash: Hex) {
  const key = `${l1Tx}:${seq}:${blockHash}`;
  let t = tickets.get(key);
  if (!t) {
    t = l1.getTransactionReceipt({ hash: l1Tx }).then((r) => {
      if (r.blockHash !== blockHash) throw new Moved();
      return ticketFromLogs(r.logs, BigInt(seq));
    });
    t.catch(() => tickets.delete(key));
    tickets.set(key, t);
  }
  return t;
}

/** Ticket states that never change back, once known. */
const settled = new Map<string, Pick<TrackedDeposit, "status">>();

function noTicket(e: unknown) {
  if (!(e instanceof BaseError)) return false;
  const reverted = e.walk((x) => x instanceof ContractFunctionRevertedError);
  return (
    reverted instanceof ContractFunctionRevertedError &&
    reverted.data?.errorName === "NoTicketWithID"
  );
}

/**
 * Whether any redeem of a ticket succeeded: each one scheduled for it
 * since its creation, found in one search (it's at most days old, well
 * inside one query's range on Arbitrum), and its own transaction checked.
 * A read that fails throws rather than counting as a failed redeem, so
 * "lapsed", which is kept for good, only follows a complete check.
 */
async function redeemed(ticket: Hex, created: bigint) {
  const logs = await l2.getLogs({
    address: ARB_RETRYABLE_TX,
    event: redeemScheduled,
    args: { ticketId: ticket },
    fromBlock: created,
    toBlock: "latest",
  });
  for (const l of logs) {
    const r = await l2.getTransactionReceipt({ hash: l.args.retryTxHash! });
    if (r.status === "success") return true;
  }
  return false;
}

/**
 * A transaction's receipt, or null while it has none yet. Only "not found"
 * means that: a failed read (a timeout, the RPC down) throws, so the
 * request fails and the client keeps what it last knew, rather than being
 * told a deposit is back to processing.
 */
function receiptOrNull(hash: Hex) {
  return l2.getTransactionReceipt({ hash }).catch((e: unknown) => {
    if (e instanceof TransactionReceiptNotFoundError) return null;
    throw e;
  });
}

/**
 * Where a ticket stands. Not on Arbitrum yet: processing. Its creation
 * reverted: failed, since no ticket was made. Its automatic redeem, run
 * right after creation, succeeded: arrived. Otherwise it waited for a
 * retry: still holding a timeout, it's waiting now. Gone, it was redeemed
 * by hand, or expired, or was cancelled by its beneficiary: arrived only
 * if a redeem of it is found to have succeeded, lapsed otherwise.
 */
export async function ticketStatus(
  ticket: Hex
): Promise<Pick<TrackedDeposit, "status" | "retryBy">> {
  const known = settled.get(ticket);
  if (known) return known;
  const settle = (status: TrackedDeposit["status"]) => {
    settled.set(ticket, { status });
    return { status };
  };
  const created = await receiptOrNull(ticket);
  if (!created) return { status: "processing" };
  if (created.status !== "success") return settle("failed");

  // The automatic redeem: its own transaction, scheduled by the creation.
  const auto = parseEventLogs({
    abi: arbRetryableTxAbi,
    eventName: "RedeemScheduled",
    logs: created.logs.filter((l) =>
      isAddressEqual(l.address, ARB_RETRYABLE_TX)
    ),
  }).find((l) => l.args.ticketId === ticket && l.args.sequenceNum === 0n);
  if (auto) {
    const redeem = await receiptOrNull(auto.args.retryTxHash);
    if (!redeem) return { status: "processing" };
    if (redeem.status === "success") return settle("arrived");
  }

  try {
    const timeout = await l2.readContract({
      address: ARB_RETRYABLE_TX,
      abi: arbRetryableTxAbi,
      functionName: "getTimeout",
      args: [ticket],
    });
    return { status: "retry", retryBy: Number(timeout) };
  } catch (e) {
    if (!noTicket(e)) throw e;
  }
  return settle(
    (await redeemed(ticket, created.blockNumber)) ? "arrived" : "lapsed"
  );
}

/** The week's LPT deposits sent from or to these addresses, with state. */
export async function depositsFor(
  addresses: string[]
): Promise<TrackedDeposit[]> {
  await refresh();
  const mine = sent.filter(
    (d) => addresses.includes(d.from) || addresses.includes(d.to)
  );
  const out = await Promise.all(
    // The block is only for rescans, and a bigint doesn't go in JSON.
    mine.map(async ({ block, blockHash, ...d }) => {
      void block;
      let ticket: Hex | null;
      try {
        ticket = await ticketOf(d.l1Tx, d.seq!, blockHash);
      } catch (e) {
        // Reorged into another block since the scan: the next scan finds
        // it there. Processing meanwhile.
        if (e instanceof Moved) return { ...d, status: "processing" as const };
        throw e;
      }
      // No matching message would be a gateway change; the health check
      // catches that. Show it as still processing meanwhile.
      if (!ticket) return { ...d, status: "processing" as const };
      return { ...d, ticket, ...(await ticketStatus(ticket)) };
    })
  );
  return out.sort((a, b) => b.sentAt - a.sentAt);
}
