// Rebuilds data/bridge-withdrawals.json: every LPT withdrawal from Arbitrum
// to Ethereum since Nitro that hadn't been claimed when this ran. A claimed
// withdrawal stays claimed, so only open ones need keeping; the API route
// adds withdrawals made after `toBlock` and re-checks which were claimed.
//
// It runs before every build (`pnpm build`), so each deploy ships a fresh
// snapshot and the route's catch-up scan stays short:
//   node scripts/bridge-withdrawals.mjs --soft
// --soft never fails the build: if the public RPCs error or take longer
// than SOFT_LIMIT_MS, it leaves the committed file as it is (never wrong,
// only older). Without --soft, errors fail as usual.
//
// Addresses are the same as lib/bridge/config.ts.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createPublicClient, http, parseAbi, parseAbiItem } from "viem";
import { arbitrum, mainnet } from "viem/chains";

const L2_LPT_GATEWAY = "0x6D2457a4ad276000A615295f7A80F79E48CcD318";
const ARB_OUTBOX = "0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840";
const NITRO_L2_BLOCK = 22_207_817n;
const RANGE = 10_000_000n;

const l2 = createPublicClient({
  chain: arbitrum,
  transport: http("https://arb1.arbitrum.io/rpc", { retryCount: 5 }),
});
const l1 = createPublicClient({
  chain: mainnet,
  transport: http(
    process.env.L1_RPC_URL ?? "https://ethereum-rpc.publicnode.com",
    {
      retryCount: 5,
    }
  ),
  batch: { multicall: { batchSize: 2048 } },
});

const soft = process.argv.includes("--soft");
const SOFT_LIMIT_MS = 3 * 60_000;
if (soft) {
  // The file is written only at the very end, so stopping early keeps the
  // committed one intact. unref: a run that finishes sooner isn't held.
  setTimeout(() => {
    console.warn(
      `bridge-withdrawals: still running after ${
        SOFT_LIMIT_MS / 1000
      }s; keeping the committed snapshot.`
    );
    process.exit(0);
  }, SOFT_LIMIT_MS).unref();
}

const event = parseAbiItem(
  "event WithdrawalInitiated(address l1Token, address indexed from, address indexed to, uint256 indexed l2ToL1Id, uint256 exitNum, uint256 amount)"
);

async function main() {
  const toBlock = await l2.getBlockNumber();
  const logs = [];
  for (let lo = NITRO_L2_BLOCK; lo <= toBlock; lo += RANGE) {
    const hi = lo + RANGE - 1n < toBlock ? lo + RANGE - 1n : toBlock;
    logs.push(
      ...(await l2.getLogs({
        address: L2_LPT_GATEWAY,
        event,
        fromBlock: lo,
        toBlock: hi,
      }))
    );
  }

  const spent = await Promise.all(
    logs.map((l) =>
      l1.readContract({
        address: ARB_OUTBOX,
        abi: parseAbi(["function isSpent(uint256) view returns (bool)"]),
        functionName: "isSpent",
        args: [l.args.l2ToL1Id],
      })
    )
  );
  const open = logs.filter((_, i) => !spent[i]);

  const withdrawals = [];
  for (const l of open) {
    const block = await l2.getBlock({ blockNumber: l.blockNumber });
    withdrawals.push({
      id: l.args.l2ToL1Id.toString(),
      from: l.args.from.toLowerCase(),
      to: l.args.to.toLowerCase(),
      amount: l.args.amount.toString(),
      block: l.blockNumber.toString(),
      timestamp: Number(block.timestamp),
      tx: l.transactionHash,
    });
  }

  const out = join(
    dirname(fileURLToPath(import.meta.url)),
    "../data/bridge-withdrawals.json"
  );
  writeFileSync(
    out,
    JSON.stringify({ toBlock: toBlock.toString(), withdrawals }, null, 1) + "\n"
  );
  console.log(
    `${logs.length} withdrawals since Nitro, ${withdrawals.length} unclaimed, through L2 block ${toBlock}`
  );
}

main().catch((e) => {
  if (!soft) throw e;
  console.warn(
    `bridge-withdrawals: couldn't refresh (${
      e.shortMessage ?? e.message
    }); keeping the committed snapshot.`
  );
});
