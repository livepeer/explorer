import { createPublicClient, fallback, http, parseEventLogs } from "viem";
import { arbitrum, mainnet } from "viem/chains";

import snapshot from "@/data/bridge-withdrawals.json";
import { RPC_URLS } from "@/lib/config";

import {
  ARB_OUTBOX,
  ARB_PUBLIC_RPC,
  L2_LPT_GATEWAY,
  l2ToL1Tx,
  LOG_RANGE,
  NODE_INTERFACE,
  nodeInterfaceAbi,
  outboxAbi,
  withdrawalInitiated,
} from "./config";
import type { BridgeWithdrawal, ClaimArgs, Withdrawal } from "./types";

export class ClaimError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const l2 = createPublicClient({
  chain: arbitrum,
  transport: http(ARB_PUBLIC_RPC, { timeout: 20_000, retryCount: 2 }),
});
export const l1 = createPublicClient({
  chain: mainnet,
  transport: fallback(
    RPC_URLS[mainnet.id].map((u) => http(u, { timeout: 10_000 }))
  ),
  batch: { multicall: true },
});

/**
 * Open withdrawals: the snapshot plus any made since, scanned from where
 * the last scan stopped. Kept per server instance; a cold start scans from
 * the snapshot, a few requests' worth.
 */
let known: Withdrawal[] = snapshot.withdrawals;
let scannedTo = BigInt(snapshot.toBlock);
let scanning: Promise<void> | null = null;
let scannedAt = 0;

/**
 * Withdrawals made since the last scan. Progress is kept after each chunk,
 * so a scan cut short (a request's time limit, an RPC error) still moves
 * forward and the next one continues from there: however stale the
 * snapshot, a server catches up within a few requests.
 */
async function scanNew() {
  const latest = await l2.getBlockNumber();
  for (let lo = scannedTo + 1n; lo <= latest; lo += LOG_RANGE) {
    const hi = lo + LOG_RANGE - 1n < latest ? lo + LOG_RANGE - 1n : latest;
    const logs = await l2.getLogs({
      address: L2_LPT_GATEWAY,
      event: withdrawalInitiated,
      fromBlock: lo,
      toBlock: hi,
    });
    const blocks = new Map(
      await Promise.all(
        [...new Set(logs.map((l) => l.blockNumber))].map(
          async (b) =>
            [
              b,
              Number((await l2.getBlock({ blockNumber: b })).timestamp),
            ] as const
        )
      )
    );
    const ids = new Set(known.map((w) => w.id));
    const found: Withdrawal[] = logs
      .map((l) => ({
        id: l.args.l2ToL1Id!.toString(),
        from: l.args.from!.toLowerCase(),
        to: l.args.to!.toLowerCase(),
        amount: l.args.amount!.toString(),
        block: l.blockNumber.toString(),
        timestamp: blocks.get(l.blockNumber)!,
        tx: l.transactionHash,
      }))
      .filter((w) => !ids.has(w.id));
    known = [...known, ...found];
    scannedTo = hi;
  }
  scannedAt = Date.now();
}

/** At most one scan in flight, and none more often than every 30s. */
async function refresh() {
  if (Date.now() - scannedAt < 30_000) return;
  scanning ??= scanNew().finally(() => (scanning = null));
  await scanning;
}

/**
 * How far Ethereum has confirmed Arbitrum: withdrawals numbered below
 * `sendCount` can be claimed. From the Outbox's latest SendRootUpdated,
 * which names the Arbitrum block it covers. Confirmations land about
 * hourly, so the last ~10 hours of Ethereum blocks always hold one.
 */
let confirmed: { sendCount: bigint; timestamp: number; at: number } | null =
  null;
async function latestConfirmation() {
  if (confirmed && Date.now() - confirmed.at < 5 * 60_000) return confirmed;
  const head = await l1.getBlockNumber();
  const logs = await l1.getContractEvents({
    address: ARB_OUTBOX,
    abi: outboxAbi,
    eventName: "SendRootUpdated",
    fromBlock: head - 3_000n,
    toBlock: head,
  });
  const last = logs.at(-1);
  if (!last?.args.l2BlockHash) {
    throw new Error("No recent Arbitrum confirmation found on Ethereum");
  }
  const block = (await l2.request({
    method: "eth_getBlockByHash",
    params: [last.args.l2BlockHash, false],
  })) as { sendCount: `0x${string}`; timestamp: `0x${string}` } | null;
  if (!block) throw new Error("Confirmed Arbitrum block not found");
  confirmed = {
    sendCount: BigInt(block.sendCount),
    timestamp: Number(block.timestamp),
    at: Date.now(),
  };
  return confirmed;
}

/** Unclaimed withdrawals sent from or to any of these addresses. */
export async function withdrawalsFor(
  addresses: string[]
): Promise<BridgeWithdrawal[]> {
  await refresh();
  const mine = known.filter(
    (w) => addresses.includes(w.to) || addresses.includes(w.from)
  );
  if (!mine.length) return [];

  const [spent, conf] = await Promise.all([
    Promise.all(
      mine.map((w) =>
        l1.readContract({
          address: ARB_OUTBOX,
          abi: outboxAbi,
          functionName: "isSpent",
          args: [BigInt(w.id)],
        })
      )
    ),
    latestConfirmation(),
  ]);
  return classify(
    mine.filter((_, i) => !spent[i]),
    conf,
    Math.floor(Date.now() / 1000)
  );
}

/**
 * What claiming a withdrawal sends to the Outbox: the message Arbitrum
 * recorded for it, from its transaction, and a proof that it's part of
 * the latest state Ethereum confirmed, from Arbitrum's NodeInterface. The
 * Outbox checks the proof itself, so a wrong one can only fail, never pay
 * someone else.
 */
export async function claimArgs(id: string): Promise<ClaimArgs> {
  await refresh();
  const w = known.find((x) => x.id === id);
  if (!w) throw new ClaimError("No such LPT withdrawal.", 404);
  const [spent, conf] = await Promise.all([
    l1.readContract({
      address: ARB_OUTBOX,
      abi: outboxAbi,
      functionName: "isSpent",
      args: [BigInt(id)],
    }),
    latestConfirmation(),
  ]);
  if (spent) throw new ClaimError("This withdrawal was already claimed.", 409);
  if (BigInt(id) >= conf.sendCount) {
    throw new ClaimError(
      "This withdrawal is still in Arbitrum's withdrawal period.",
      409
    );
  }

  const receipt = await l2.getTransactionReceipt({
    hash: w.tx as `0x${string}`,
  });
  const msg = parseEventLogs({ abi: [l2ToL1Tx], logs: receipt.logs }).find(
    (l) => l.args.position === BigInt(id)
  );
  if (!msg) throw new ClaimError("Withdrawal message not found.", 502);
  const [, , proof] = await l2.readContract({
    address: NODE_INTERFACE,
    abi: nodeInterfaceAbi,
    functionName: "constructOutboxProof",
    args: [conf.sendCount, BigInt(id)],
  });
  const a = msg.args;
  return {
    proof: [...proof],
    index: id,
    l2Sender: a.caller,
    to: a.destination,
    l2Block: a.arbBlockNum.toString(),
    l1Block: a.ethBlockNum.toString(),
    l2Timestamp: a.timestamp.toString(),
    value: a.callvalue.toString(),
    data: a.data,
  };
}

/**
 * Ready once Ethereum has confirmed Arbitrum past the withdrawal's message
 * number. Otherwise an estimate: confirmations run `now - confirmed` behind,
 * so it becomes claimable about that long after it was made.
 */
export function classify(
  open: Withdrawal[],
  confirmed: { sendCount: bigint; timestamp: number },
  nowSec: number
): BridgeWithdrawal[] {
  const lag = Math.max(0, nowSec - confirmed.timestamp);
  return open.map((w) => {
    const ready = BigInt(w.id) < confirmed.sendCount;
    return {
      ...w,
      status: ready ? "ready" : "waiting",
      readyAt: ready ? null : w.timestamp + lag,
    };
  });
}
