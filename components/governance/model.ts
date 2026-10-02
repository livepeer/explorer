"use client";

import { useQuery } from "@tanstack/react-query";
import { keccak256, toBytes } from "viem";
import { useBlockNumber, useReadContract } from "wagmi";

import { useNow } from "@/components/shell/round-clock";
import { controller } from "@/lib/abis/Controller";
import { CONTRACTS, L1_CHAIN, L2_CHAIN } from "@/lib/config";
import { formatDate, formatDuration } from "@/lib/format";
import { useProtocol } from "@/lib/hooks/queries";
import type { Poll, Protocol, TreasuryProposal } from "@/lib/subgraph/network";

export { parseDocument, proposalDocument } from "@/lib/governance/document";
import { parseDocument } from "@/lib/governance/document";

/* ── Treasury proposals ──────────────────────────────────────────────────── */

export type ProposalPhase = "pending" | "active" | "ended";

/**
 * Governor clock is BondingVotes rounds. Matches OpenZeppelin's Governor:
 * pending while the current round ≤ snapshot (`voteStart`), active through
 * the `voteEnd` round, ended after.
 */
export function proposalPhase(
  p: TreasuryProposal,
  currentRound: number
): ProposalPhase {
  if (currentRound <= p.voteStart) return "pending";
  if (currentRound <= p.voteEnd) return "active";
  return "ended";
}

/** Estimated unix time (s) at which `round` starts. */
export function roundStartsAt(protocol: Protocol, round: number) {
  return (
    protocol.roundStartTs +
    (round - protocol.currentRound) * protocol.roundSeconds
  );
}

/** Voting opens once the snapshot round is over and closes when `voteEnd` ends. */
export function proposalWindow(p: TreasuryProposal, protocol: Protocol) {
  return {
    opensAt: roundStartsAt(protocol, p.voteStart + 1),
    closesAt: roundStartsAt(protocol, p.voteEnd + 1),
  };
}

export type Outcome = {
  label: string;
  tone: "positive" | "negative" | "neutral";
};

/** Subgraph-only outcome. Quorum isn't indexed, so this is a majority, not a verdict. */
export function proposalMajority(p: TreasuryProposal): Outcome {
  if (p.forVotes + p.againstVotes + p.abstainVotes <= 0)
    return { label: "No votes", tone: "neutral" };
  if (p.forVotes > p.againstVotes)
    return { label: "Majority for", tone: "positive" };
  if (p.againstVotes > p.forVotes)
    return { label: "Majority against", tone: "negative" };
  return { label: "Tied", tone: "neutral" };
}

/** OpenZeppelin `IGovernor.ProposalState`, read on-chain on the detail page. */
export const GOVERNOR_STATES: Record<
  number,
  Outcome & { phase: ProposalPhase }
> = {
  0: { label: "Pending", tone: "neutral", phase: "pending" },
  1: { label: "Active", tone: "positive", phase: "active" },
  2: { label: "Canceled", tone: "neutral", phase: "ended" },
  3: { label: "Defeated", tone: "negative", phase: "ended" },
  4: { label: "Succeeded", tone: "positive", phase: "ended" },
  5: { label: "Queued", tone: "positive", phase: "ended" },
  6: { label: "Expired", tone: "neutral", phase: "ended" },
  7: { label: "Executed", tone: "positive", phase: "ended" },
};

/* ── LIP polls ───────────────────────────────────────────────────────────── */

export const L1_BLOCK_SECONDS = 12;

export type PollPhase = "active" | "ended" | "unknown";

/**
 * Current Ethereum block; polls end at an L1 block number. Uses the live
 * block from an L1 RPC when one answers, otherwise estimates it from the
 * round clock (rounds are measured in L1 blocks and the subgraph records
 * each round's start block), so the list never waits on an RPC.
 */
export function useL1Block() {
  const { data } = useBlockNumber({
    chainId: L1_CHAIN.id,
    query: { refetchInterval: 60_000, staleTime: 30_000, retry: 1 },
  });
  const { data: protocol, isLoading: protocolLoading } = useProtocol();
  const nowMs = useNow(30_000);
  if (data != null) return { block: Number(data), isLoading: false };
  const current = protocol?.recentRounds.find(
    (r) => r.round === protocol.currentRound
  );
  if (protocol && current) {
    const elapsed = Math.max(0, nowMs / 1000 - current.ts);
    return {
      block: Math.floor(
        current.startBlock + elapsed / protocol.secondsPerBlock
      ),
      isLoading: false,
    };
  }
  return { block: null, isLoading: protocolLoading };
}

export function pollPhase(p: Poll, l1Block: number | null): PollPhase {
  if (l1Block == null) return "unknown";
  return l1Block <= p.endBlock ? "active" : "ended";
}

/** Estimated unix time (s) of the poll's end block. */
export function pollEndsAt(p: Poll, l1Block: number | null, nowMs: number) {
  if (l1Block == null) return null;
  return nowMs / 1000 + (p.endBlock - l1Block) * L1_BLOCK_SECONDS;
}

export function pollMajority(p: Poll): Outcome {
  if (p.yes + p.no <= 0) return { label: "No votes", tone: "neutral" };
  if (p.yes > p.no) return { label: "Majority yes", tone: "positive" };
  if (p.no > p.yes) return { label: "Majority no", tone: "negative" };
  return { label: "Tied", tone: "neutral" };
}

export type PollDocument = {
  lip: string | null;
  title: string | null;
  created: string | null;
  body: string;
  commitHash: string | null;
};

const IPFS_GATEWAYS = [
  "https://ipfs.livepeer.com/ipfs/",
  "https://ipfs.io/ipfs/",
];

export async function fetchPollDocument(hash: string): Promise<PollDocument> {
  let lastError: unknown = null;
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const res = await fetch(gateway + hash, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`IPFS gateway returned ${res.status}`);
      const json = (await res.json()) as {
        text?: unknown;
        gitCommitHash?: unknown;
      };
      if (typeof json.text !== "string")
        throw new Error("Unexpected IPFS document");
      const { attributes, body } = parseDocument(json.text);
      return {
        lip: attributes.lip || null,
        title: attributes.title || null,
        created: attributes.created || null,
        body,
        commitHash:
          typeof json.gitCommitHash === "string" ? json.gitCommitHash : null,
      };
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Couldn't load proposal from IPFS");
}

/** The LIP text a poll points at, pinned to IPFS by the poll's creator. */
export function usePollDocument(hash: string | undefined) {
  return useQuery({
    queryKey: ["poll-document", hash],
    queryFn: () => fetchPollDocument(hash!),
    enabled: Boolean(hash),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
}

export function pollTitle(p: Poll, doc: PollDocument | undefined) {
  if (doc?.title) return doc.lip ? `LIP-${doc.lip}: ${doc.title}` : doc.title;
  return `Poll ${p.id.slice(0, 8)}…`;
}

/* ── Contracts ───────────────────────────────────────────────────────────── */

/** Resolve a protocol contract through the Controller registry on Arbitrum. */
export function useControllerContract(
  name: "LivepeerGovernor" | "BondingVotes" | "Treasury"
) {
  const { data } = useReadContract({
    address: CONTRACTS.controller,
    abi: controller,
    functionName: "getContract",
    args: [keccak256(toBytes(name))],
    chainId: L2_CHAIN.id,
    query: { staleTime: Infinity },
  });
  return data as `0x${string}` | undefined;
}

/** uint256 id from the subgraph's string id (decimal or hex); null if malformed. */
export function toProposalId(id: string): bigint | null {
  try {
    return BigInt(id);
  } catch {
    return null;
  }
}

/* ── Time copy ───────────────────────────────────────────────────────────── */

export function formatWhen(ts: number, nowMs: number) {
  const sameYear =
    new Date(ts * 1000).getFullYear() === new Date(nowMs).getFullYear();
  return formatDate(
    ts,
    sameYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" }
  );
}

export function formatDateTime(ts: number) {
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "Ends in ~2d 4h" / "Ended ~Mar 3" / "Starts in ~6h 10m". Estimates carry a tilde. */
export function timeCopy(
  phase: "pending" | "active" | "ended",
  ts: number,
  nowMs: number
) {
  const diff = ts - nowMs / 1000;
  if (phase === "pending")
    return diff > 0 ? `Starts in ~${formatDuration(diff)}` : "Starting soon";
  if (phase === "active")
    return diff > 0 ? `Ends in ~${formatDuration(diff)}` : "Ending soon";
  return `Ended ~${formatWhen(ts, nowMs)}`;
}
