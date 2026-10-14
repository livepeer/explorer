"use client";

import { Check } from "lucide-react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";

import { Skeleton } from "@/components/ui/misc";
import { bondingVotes } from "@/lib/abis/BondingVotes";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { L2_CHAIN } from "@/lib/config";
import { formatLPT, fromWei } from "@/lib/format";
import { proposalThresholds } from "@/lib/governance/thresholds";
import type { TreasuryProposal } from "@/lib/subgraph/network";

import { toProposalId, useControllerContract } from "./model";
import { VoteForm } from "./vote-form";

/** On-chain proposal state (OpenZeppelin ProposalState enum), if readable. */
export function useProposalState(proposal: TreasuryProposal | undefined) {
  const governor = useControllerContract("LivepeerGovernor");
  const id = proposal ? toProposalId(proposal.id) : null;
  const { data } = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "state",
    args: [id ?? 0n],
    chainId: L2_CHAIN.id,
    query: {
      enabled: Boolean(governor && id != null),
      refetchInterval: 60_000,
    },
  });
  return data == null ? null : Number(data);
}

/**
 * Quorum and quota for a treasury proposal, read from the governor. Neither
 * is indexed, so these come from the chain. Voting power is fixed at the
 * snapshot round, which the contracts only answer for once it has passed:
 * before then, use the latest round they can.
 */
export function useProposalThresholds(
  proposal: TreasuryProposal | undefined,
  currentRound: number | undefined
) {
  const governor = useControllerContract("LivepeerGovernor");
  const votes = useControllerContract("BondingVotes");
  const snapshot =
    proposal && currentRound != null
      ? BigInt(Math.min(proposal.voteStart, currentRound - 1))
      : null;
  const enabled = snapshot != null;
  const quorum = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "quorum",
    args: [snapshot ?? 0n],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor && enabled) },
  });
  const supply = useReadContract({
    address: votes,
    abi: bondingVotes,
    functionName: "getPastTotalSupply",
    args: [snapshot ?? 0n],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(votes && enabled) },
  });
  const quota = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "quota",
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor) },
  });
  if (!proposal || quorum.data == null || supply.data == null) return null;
  if (quota.data == null) return null;
  return proposalThresholds({
    quorumVotes: fromWei(quorum.data),
    totalSupply: fromWei(supply.data),
    quotaPpm: Number(quota.data),
    forVotes: proposal.forVotes,
    againstVotes: proposal.againstVotes,
    abstainVotes: proposal.abstainVotes,
  });
}

/**
 * Treasury ballot: `LivepeerGovernor.castVoteWithReason(proposalId, support,
 * reason)` with support 0 = against, 1 = for, 2 = abstain.
 */
export function ProposalVoteForm({ proposal }: { proposal: TreasuryProposal }) {
  const { address } = useAccount();
  const governor = useControllerContract("LivepeerGovernor");
  const votes = useControllerContract("BondingVotes");
  const { writeContractAsync } = useWriteContract();
  const id = toProposalId(proposal.id);

  const hasVoted = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "hasVoted",
    args: [id ?? 0n, address!],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor && address && id != null) },
  });
  const power = useReadContract({
    address: votes,
    abi: bondingVotes,
    functionName: "getPastVotes",
    args: [address!, BigInt(proposal.voteStart)],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(votes && address) },
  });

  if (id == null) return null;

  if (address && hasVoted.isLoading)
    return <Skeleton className="h-[132px] w-full" />;

  if (hasVoted.data === true) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-hover px-3 py-3 text-ui-body">
        <Check className="size-4 text-green-bright" /> You voted on this
        proposal
      </p>
    );
  }

  const weight = power.data != null ? fromWei(power.data as bigint) : null;

  return (
    <VoteForm
      withReason
      choices={[
        { value: 1, label: "For" },
        { value: 0, label: "Against" },
        { value: 2, label: "Abstain" },
      ]}
      send={(support, reason) => {
        if (!governor) throw new Error("Governor contract not resolved yet");
        return writeContractAsync({
          address: governor,
          abi: livepeerGovernor,
          functionName: "castVoteWithReason",
          args: [id, support, reason],
          chainId: L2_CHAIN.id,
        });
      }}
      onConfirmed={() => hasVoted.refetch()}
      note={
        weight != null && (
          <div className="flex items-baseline justify-between gap-3 text-ui-caption">
            <span className="text-muted-foreground">
              Your voting power · round {proposal.voteStart.toLocaleString()}
            </span>
            <span className="font-mono tabular-nums">{formatLPT(weight)}</span>
          </div>
        )
      }
    />
  );
}
