import {
  BaseError,
  ContractFunctionRevertedError,
  type Hex,
  parseAbiItem,
} from "viem";

import { L1_LPT, L1_LPT_GATEWAY } from "./config";
import { ARB_RETRYABLE_TX, arbRetryableTxAbi, ticketFromLogs } from "./tickets";
import type { TrackedDeposit } from "./types";
import { l1, l2 } from "./withdrawals-server";

/*
 * LPT deposits from Ethereum to Arbitrum, found from the Ethereum gateway's
 * events (so they show on any device, not just the browser that sent them)
 * and each one's state read from its Arbitrum ticket (see tickets.ts).
 */

/**
 * How far back to look. A ticket lasts 7 days from creation, so anything
 * older has either arrived or expired; past that, "no ticket" can't tell
 * the two apart, and there's nothing left to act on anyway.
 */
const WINDOW_SECONDS = 7 * 86_400;
/** Ethereum makes a block every 12s; a few extra cover any slow ones. */
const WINDOW_BLOCKS = BigInt(WINDOW_SECONDS / 12 + 600);
/** Keyed RPCs search logs at most 10k blocks at a time. */
const CHUNK = 10_000n;

const depositInitiated = parseAbiItem(
  "event DepositInitiated(address l1Token, address indexed _from, address indexed _to, uint256 indexed _sequenceNumber, uint256 _amount)"
);

type Sent = Omit<TrackedDeposit, "status" | "retryBy">;

/**
 * The week's deposits, scanned once and then from where the last scan
 * stopped, at most every 15s, shared by every request on this instance.
 */
let sent: Sent[] = [];
let scannedTo = 0n;
let scannedAt = 0;
let scanning: Promise<void> | null = null;

async function scan() {
  const latest = await l1.getBlockNumber();
  const floor = latest > WINDOW_BLOCKS ? latest - WINDOW_BLOCKS : 0n;
  const found: Sent[] = [];
  for (let lo = scannedTo ? scannedTo + 1n : floor; lo <= latest; ) {
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
      });
    }
    lo = hi + 1n;
  }
  const cutoff = Date.now() / 1000 - WINDOW_SECONDS;
  sent = [...sent, ...found].filter((d) => d.sentAt >= cutoff);
  scannedTo = latest;
  scannedAt = Date.now();
}

async function refresh() {
  if (Date.now() - scannedAt < 15_000) return;
  scanning ??= scan().finally(() => (scanning = null));
  await scanning;
}

/**
 * Each deposit's ticket id, fixed once its Ethereum transaction is in.
 * Keyed by transaction and message number: one transaction can hold
 * several deposits, each with its own ticket.
 */
const tickets = new Map<string, Promise<Hex | null>>();
function ticketOf(l1Tx: Hex, seq: string) {
  const key = `${l1Tx}:${seq}`;
  let t = tickets.get(key);
  if (!t) {
    t = l1
      .getTransactionReceipt({ hash: l1Tx })
      .then((r) => ticketFromLogs(r.logs, BigInt(seq)));
    t.catch(() => tickets.delete(key));
    tickets.set(key, t);
  }
  return t;
}

/** Tickets known to be redeemed: that never changes back. */
const redeemed = new Set<string>();

function noTicket(e: unknown) {
  if (!(e instanceof BaseError)) return false;
  const reverted = e.walk((x) => x instanceof ContractFunctionRevertedError);
  return (
    reverted instanceof ContractFunctionRevertedError &&
    reverted.data?.errorName === "NoTicketWithID"
  );
}

/**
 * Where a ticket stands. Not on Arbitrum yet: processing. On Arbitrum and
 * still holding a timeout: its automatic redeem failed and it waits for a
 * retry. On Arbitrum with no ticket left: redeemed (within the window, it
 * can't have expired).
 */
export async function ticketStatus(
  ticket: Hex
): Promise<Pick<TrackedDeposit, "status" | "retryBy">> {
  if (redeemed.has(ticket)) return { status: "arrived" };
  const created = await l2
    .getTransactionReceipt({ hash: ticket })
    .catch(() => null);
  if (!created) return { status: "processing" };
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
    redeemed.add(ticket);
    return { status: "arrived" };
  }
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
    mine.map(async (d) => {
      const ticket = await ticketOf(d.l1Tx, d.seq!);
      // No matching message would be a gateway change; the health check
      // catches that. Show it as still processing meanwhile.
      if (!ticket) return { ...d, status: "processing" as const };
      return { ...d, ...(await ticketStatus(ticket)) };
    })
  );
  return out.sort((a, b) => b.sentAt - a.sentAt);
}
