"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { type Hex, keccak256, toBytes } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { useNow } from "@/components/shell/round-clock";
import { Button } from "@/components/ui/button";
import { SafeProposed } from "@/components/wallet/safe-proposed";
import { livepeerGovernor } from "@/lib/abis/LivepeerGovernor";
import { L2_CHAIN, txUrl } from "@/lib/config";
import { formatDuration } from "@/lib/format";
import type { TreasuryProposal } from "@/lib/subgraph/network";

import { formatDateTime, toProposalId, useControllerContract } from "./model";
import { useGovernanceTx } from "./use-governance-tx";

/** The governor's states for a passed proposal on its way to running. */
const SUCCEEDED = 4;
const QUEUED = 5;

/**
 * After a treasury proposal passes, it runs in two steps anyone can take:
 * queue it, which starts the timelock, then execute it once the timelock
 * has passed, which makes its calls (for a funding request, the transfer).
 * Both pass the proposal's calls and description hash back to the governor.
 */
export function ProposalNextStep({
  proposal,
  state,
}: {
  proposal: TreasuryProposal;
  /** The governor's state for it, read on-chain. */
  state: number | null;
}) {
  if (state !== SUCCEEDED && state !== QUEUED) return null;
  return <NextStep proposal={proposal} queued={state === QUEUED} />;
}

function NextStep({
  proposal,
  queued,
}: {
  proposal: TreasuryProposal;
  queued: boolean;
}) {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const governor = useControllerContract("LivepeerGovernor");
  const queryClient = useQueryClient();
  const tx = useGovernanceTx();
  const nowMs = useNow(10_000);
  const id = toProposalId(proposal.id);

  // When a queued proposal's timelock ends, unix seconds.
  const { data: eta } = useReadContract({
    address: governor,
    abi: livepeerGovernor,
    functionName: "proposalEta",
    args: [id ?? 0n],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(governor && id != null && queued) },
  });
  const etaMs = eta != null && eta > 0n ? Number(eta) * 1000 : null;
  const waiting = queued && (etaMs == null || nowMs < etaMs);

  // Done: read the new state (and timelock) from the chain.
  useEffect(() => {
    if (tx.confirmed)
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }, [tx.confirmed, queryClient]);

  const act = () =>
    tx.send({
      address: governor!,
      abi: livepeerGovernor,
      functionName: queued ? "execute" : "queue",
      args: [
        proposal.calls.targets as Hex[],
        proposal.calls.values.map((v) => BigInt(v)),
        proposal.calls.calldatas as Hex[],
        keccak256(toBytes(proposal.description)),
      ],
    });

  const verb = queued ? "Execute" : "Queue";
  const busy = tx.signing || tx.confirming || tx.checking;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-ui-caption text-pretty text-muted-foreground">
        {queued
          ? waiting && etaMs != null
            ? `Queued. It can be executed after ${formatDateTime(
                etaMs / 1000
              )}, in ${formatDuration(Math.max(0, (etaMs - nowMs) / 1000))}.`
            : "Queued and through its timelock. Executing it makes its calls. Anyone can execute it."
          : "Passed. Queueing it starts the timelock before it can be executed. Anyone can queue it."}
      </p>
      {tx.proposed && address ? (
        <div className="rounded-md bg-hover px-3">
          <SafeProposed safe={address} id={tx.hash}>
            Queued in your Safe. It takes effect once the owners sign and
            execute it.
          </SafeProposed>
        </div>
      ) : tx.confirmed && tx.hash ? (
        <p className="flex items-center gap-2 text-ui-body">
          <Check className="size-4 text-green-bright" />
          {queued ? "Executed" : "Queued"}.{" "}
          <a
            href={txUrl(tx.hash)}
            target="_blank"
            rel="noreferrer"
            className="text-ui-caption text-muted-foreground hover:text-foreground"
          >
            View transaction
          </a>
        </p>
      ) : !isConnected ? (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => openConnectModal?.()}
        >
          Connect wallet to {verb.toLowerCase()}
        </Button>
      ) : (
        <Button
          variant="primary"
          className="w-full"
          disabled={!governor || id == null || waiting || busy}
          onClick={act}
        >
          {busy && <Loader2 className="animate-spin" />}
          {tx.signing
            ? "Confirm in wallet…"
            : tx.confirming
            ? "Confirming…"
            : verb}
        </Button>
      )}
      {tx.error && (
        <p className="text-ui-caption text-destructive">{tx.error}</p>
      )}
    </div>
  );
}
