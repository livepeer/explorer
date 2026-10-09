import { cache } from "react";
import { createPublicClient, fallback, http, isAddress } from "viem";
import { mainnet } from "viem/chains";

import { RPC_URLS } from "@/lib/config";
import {
  formatETH,
  formatLPT,
  formatPercent,
  formatToken,
  shortAddress,
} from "@/lib/format";
import { parseDocument } from "@/lib/governance/document";
import { fetchGateway } from "@/lib/subgraph/gateways";
import {
  fetchGovernance,
  fetchOrchestratorSummary,
  fetchProtocol,
  type Protocol,
} from "@/lib/subgraph/network";

import { type Card, OG_COLORS } from "./card";

/**
 * What a shared link says about a page: its <title>, description, and the
 * card drawn for its image. Read on the server with short timeouts; a
 * missing name or number falls back rather than failing the share.
 */

export type Share = { title: string; description: string; card: Card };

const l1 = createPublicClient({
  chain: mainnet,
  transport: fallback(
    RPC_URLS[mainnet.id].map((url) => http(url, { timeout: 3_000 }))
  ),
});

const ensName = cache(async (address: string) => {
  try {
    return await l1.getEnsName({ address: address as `0x${string}` });
  } catch {
    return null;
  }
});

const protocol = cache(() => fetchProtocol());
const governance = cache(() => fetchGovernance());

const pct = (part: number, whole: number) =>
  whole > 0 ? formatPercent((part / whole) * 100, { decimals: 1 }) : "—";

function roundEndsIn(p: Protocol, round: number) {
  const ts = p.roundStartTs + (round + 1 - p.currentRound) * p.roundSeconds;
  const days = Math.max(0, (ts - Date.now() / 1000) / 86_400);
  return days >= 1
    ? `${Math.round(days)} day${Math.round(days) === 1 ? "" : "s"}`
    : "under a day";
}

export const orchestratorShare = cache(
  async (address: string): Promise<Share | null> => {
    if (!isAddress(address)) return null;
    const p = await protocol();
    const [o, name] = await Promise.all([
      fetchOrchestratorSummary(address, p),
      ensName(address),
    ]);
    if (!o) return null;
    const display = name ?? shortAddress(address);
    const apr = o.realizedApr != null ? `${o.realizedApr.toFixed(0)}%` : "—";
    const calls = `${o.rewardCalls}/${o.rewardWindow}`;
    return {
      title: display,
      description: `${display} · ${apr} APR · ${calls} reward calls · ${formatLPT(
        o.totalStake,
        { compact: true }
      )} staked. Livepeer orchestrator.`,
      card: {
        eyebrow: o.active ? "Orchestrator · Active" : "Orchestrator · Inactive",
        title: display,
        subtitle: name ? shortAddress(address) : undefined,
        stats: [
          { label: "Realised APR", value: apr, tone: "positive" },
          {
            label: "Reward calls · 30 rounds",
            value: calls,
            tone: o.rewardCalls < o.rewardWindow - 2 ? "negative" : undefined,
          },
          {
            label: "Total stake",
            value: `${formatToken(o.totalStake, { compact: true })} LPT`,
          },
          {
            label: "Reward cut · Fee share",
            value: `${o.rewardCut.toFixed(0)}% · ${o.feeShare.toFixed(0)}%`,
          },
        ],
      },
    };
  }
);

export const gatewayShare = cache(
  async (address: string): Promise<Share | null> => {
    if (!isAddress(address)) return null;
    const [g, name] = await Promise.all([
      fetchGateway(address.toLowerCase()),
      ensName(address),
    ]);
    if (!g) return null;
    const display = name ?? shortAddress(address);
    return {
      title: display,
      description: `${display} paid ${formatETH(
        g.thirtyDayVolumeETH
      )} in fees over the last 30 days. Livepeer gateway.`,
      card: {
        eyebrow: "Gateway",
        title: display,
        subtitle: name ? shortAddress(address) : undefined,
        stats: [
          {
            label: "Fees paid · 30 days",
            value: formatETH(g.thirtyDayVolumeETH),
            tone: "positive",
          },
          { label: "Fees paid · all time", value: formatETH(g.totalVolumeETH) },
          { label: "Deposit", value: formatETH(g.deposit) },
          { label: "Reserve", value: formatETH(g.reserve) },
        ],
      },
    };
  }
);

export const proposalShare = cache(
  async (id: string): Promise<Share | null> => {
    const [{ proposals }, p] = await Promise.all([governance(), protocol()]);
    const prop = proposals.find((x) => x.id === id);
    if (!prop) return null;
    const phase =
      p.currentRound <= prop.voteStart
        ? "Voting soon"
        : p.currentRound <= prop.voteEnd
        ? `Voting · closes in ${roundEndsIn(p, prop.voteEnd)}`
        : "Voting closed";
    const cast = prop.forVotes + prop.againstVotes + prop.abstainVotes;
    return {
      title: prop.title,
      description: `Treasury proposal. ${phase}. ${pct(
        prop.forVotes,
        cast
      )} For, ${pct(prop.againstVotes, cast)} Against.`,
      card: {
        eyebrow: `Treasury proposal · ${phase}`,
        title: prop.title,
        bar: [
          { value: prop.forVotes, color: OG_COLORS.green },
          { value: prop.againstVotes, color: OG_COLORS.red },
          { value: prop.abstainVotes, color: OG_COLORS.muted },
        ],
        stats: [
          { label: "For", value: pct(prop.forVotes, cast), tone: "positive" },
          {
            label: "Against",
            value: pct(prop.againstVotes, cast),
            tone: "negative",
          },
          { label: "Abstain", value: pct(prop.abstainVotes, cast) },
          {
            label: "Votes cast",
            value: `${formatToken(cast, { compact: true })} LPT`,
          },
        ],
      },
    };
  }
);

async function pollDocument(hash: string) {
  try {
    const res = await fetch(`https://ipfs.livepeer.com/ipfs/${hash}`, {
      signal: AbortSignal.timeout(5_000),
      next: { revalidate: 86_400 },
    });
    const json = (await res.json()) as { text?: unknown };
    if (typeof json.text !== "string") return null;
    return parseDocument(json.text).attributes;
  } catch {
    return null;
  }
}

/** Current L1 block, estimated from the round clock like the poll pages do. */
function l1BlockNow(p: Protocol) {
  const current = p.recentRounds.find((r) => r.round === p.currentRound);
  if (!current) return null;
  return Math.floor(
    current.startBlock + (Date.now() / 1000 - current.ts) / p.secondsPerBlock
  );
}

export const pollShare = cache(async (id: string): Promise<Share | null> => {
  const [{ polls }, p] = await Promise.all([governance(), protocol()]);
  const poll = polls.find((x) => x.id === id.toLowerCase());
  if (!poll) return null;
  const doc = await pollDocument(poll.proposal);
  const title = doc?.title
    ? doc.lip
      ? `LIP-${doc.lip}: ${doc.title}`
      : doc.title
    : `Poll ${shortAddress(poll.id)}`;
  const block = l1BlockNow(p);
  const open = block != null && block <= poll.endBlock;
  const days = block != null ? ((poll.endBlock - block) * 12) / 86_400 : null;
  const phase = open
    ? days != null && days >= 1
      ? `Voting · closes in ${Math.round(days)} day${
          Math.round(days) === 1 ? "" : "s"
        }`
      : "Voting · closes in under a day"
    : "Voting closed";
  const cast = poll.yes + poll.no;
  return {
    title,
    description: `LIP poll. ${phase}. ${pct(poll.yes, cast)} Yes, ${pct(
      poll.no,
      cast
    )} No.`,
    card: {
      eyebrow: `LIP poll · ${phase}`,
      title,
      bar: [
        { value: poll.yes, color: OG_COLORS.green },
        { value: poll.no, color: OG_COLORS.red },
      ],
      stats: [
        { label: "Yes", value: pct(poll.yes, cast), tone: "positive" },
        { label: "No", value: pct(poll.no, cast), tone: "negative" },
        { label: "Voters", value: String(poll.voteCount) },
        {
          label: "Stake voted",
          value: `${formatToken(cast, { compact: true })} LPT`,
        },
      ],
    },
  };
});
