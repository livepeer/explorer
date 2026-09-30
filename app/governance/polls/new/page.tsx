"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toHex } from "viem";
import { useAccount, useReadContract } from "wagmi";

import { useGovernanceTx } from "@/components/governance/use-governance-tx";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Page,
  PageHeader,
} from "@/components/page";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { SafeProposed } from "@/components/wallet/safe-proposed";
import { bondingManager } from "@/lib/abis/BondingManager";
import { pollCreator } from "@/lib/abis/PollCreator";
import { cn } from "@/lib/cn";
import { CONTRACTS, L2_CHAIN, txUrl } from "@/lib/config";
import { formatLPT, fromWei } from "@/lib/format";
import { useProtocolContract } from "@/lib/staking/contracts";

type Lip = { lip: string; title: string; created: string | null; url: string };

async function fetchLips(): Promise<{ commit: string; lips: Lip[] }> {
  const res = await fetch("/api/governance/lips");
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Couldn't load LIPs");
  return json;
}

/**
 * Put a LIP to a stake-weighted poll. PollCreator requires 100 LPT of
 * delegated stake (or an orchestrator's total stake) and no fee; the LIP's
 * text is pinned to IPFS by the explorer and the poll points at it.
 */
export default function NewPollPage() {
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const bm = useProtocolContract("BondingManager");
  const [selected, setSelected] = useState<string | null>(null);
  const [pinning, setPinning] = useState(false);
  const tx = useGovernanceTx();

  const lips = useQuery({
    queryKey: ["pollable-lips"],
    queryFn: fetchLips,
    staleTime: 5 * 60_000,
  });
  const { data: cost } = useReadContract({
    address: CONTRACTS.pollCreator,
    abi: pollCreator,
    functionName: "POLL_CREATION_COST",
    chainId: L2_CHAIN.id,
    query: { staleTime: Infinity },
  });
  const { data: stake } = useReadContract({
    address: bm,
    abi: bondingManager,
    functionName: "pendingStake",
    args: [address!, 0n],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(bm && address) },
  });
  const { data: orchestratorStake } = useReadContract({
    address: bm,
    abi: bondingManager,
    functionName: "transcoderTotalStake",
    args: [address!],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(bm && address) },
  });

  const required = cost as bigint | undefined;
  const has = [stake, orchestratorStake]
    .map((v) => (v as bigint | undefined) ?? 0n)
    .reduce((a, b) => (a > b ? a : b), 0n);
  const eligible = required != null && has >= required;
  const busy = pinning || tx.signing || tx.confirming;

  const create = async () => {
    if (!selected) return;
    tx.setError(null);
    setPinning(true);
    let hash: string;
    try {
      const res = await fetch("/api/governance/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lip: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't pin the LIP");
      hash = json.hash;
    } catch (e) {
      tx.setError(e instanceof Error ? e.message : String(e));
      return;
    } finally {
      setPinning(false);
    }
    await tx.send({
      address: CONTRACTS.pollCreator,
      abi: pollCreator,
      functionName: "createPoll",
      args: [toHex(hash)],
    });
  };

  const chosen = lips.data?.lips.find((l) => l.lip === selected);

  return (
    <Page className="max-w-[760px]">
      <Link
        href="/governance?tab=polls"
        className="mb-6 inline-flex items-center gap-1.5 text-ui-caption text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Governance
      </Link>
      <PageHeader
        title="New poll"
        description="Put a proposed LIP to a stake-weighted vote. Polls run for 10 rounds and need 33.33% of stake to vote, with more than half voting yes. Creating one needs 100 LPT staked and costs no LPT."
      />

      {tx.proposed && address ? (
        <Card className="px-5">
          <SafeProposed safe={address}>
            The poll for LIP-{selected} is queued in your Safe. It opens once
            the owners sign and execute it.
          </SafeProposed>
        </Card>
      ) : tx.confirmed ? (
        <Card>
          <EmptyState
            icon={<Check />}
            title={`Poll created for LIP-${selected}`}
            description="It appears in Governance as soon as the network data catches up, usually within a minute."
            action={
              <div className="flex gap-2">
                <Button
                  size="sm"
                  render={<Link href="/governance?tab=polls" />}
                >
                  Go to polls
                </Button>
                {tx.hash && (
                  <Button
                    size="sm"
                    variant="ghost"
                    render={
                      <a
                        href={txUrl(tx.hash)}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    Arbiscan <ExternalLink />
                  </Button>
                )}
              </div>
            }
          />
        </Card>
      ) : lips.error ? (
        <ErrorNotice error={lips.error} onRetry={() => lips.refetch()} />
      ) : !lips.data ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : lips.data.lips.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText />}
            title="No LIPs are open for a poll"
            description="Only LIPs with status Proposed, and without a poll already, can be put to a vote. Propose a LIP in the LIPs repository first."
            action={
              <a
                href="https://github.com/livepeer/LIPS"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-ui-caption text-foreground underline-offset-4 hover:underline"
              >
                LIPs repository <ExternalLink className="size-3" />
              </a>
            }
          />
        </Card>
      ) : (
        <>
          <div
            role="radiogroup"
            aria-label="LIP to put to a poll"
            className="flex flex-col gap-2"
          >
            {lips.data.lips.map((l) => {
              const on = l.lip === selected;
              return (
                <div
                  key={l.lip}
                  role="radio"
                  aria-checked={on}
                  tabIndex={0}
                  onClick={() => !busy && setSelected(l.lip)}
                  onKeyDown={(e) =>
                    (e.key === " " || e.key === "Enter") &&
                    !busy &&
                    setSelected(l.lip)
                  }
                  className={cn(
                    "surface flex cursor-pointer items-center gap-4 px-4 py-3.5 outline-none transition-colors focus-visible:ring-1 focus-visible:ring-green-bright/40",
                    on ? "border-foreground/40" : "hover:bg-hover/60"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      on ? "border-foreground" : "border-border"
                    )}
                  >
                    {on && (
                      <span className="size-2 rounded-full bg-foreground" />
                    )}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-ui-body text-foreground">
                      LIP-{l.lip}: {l.title}
                    </span>
                    {l.created && (
                      <span className="text-ui-caption text-muted-foreground">
                        Created {l.created}
                      </span>
                    )}
                  </span>
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex shrink-0 items-center gap-1 text-ui-caption text-muted-foreground hover:text-foreground"
                  >
                    Read <ExternalLink className="size-3" />
                  </a>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col items-end gap-2">
            {tx.error && (
              <p className="text-ui-caption text-destructive">{tx.error}</p>
            )}
            {!isConnected ? (
              <Button variant="primary" onClick={() => openConnectModal?.()}>
                Connect wallet to create a poll
              </Button>
            ) : (
              <>
                {required != null && !eligible && (
                  <p className="text-ui-caption text-muted-foreground">
                    You need {formatLPT(fromWei(required))} staked to create a
                    poll. This wallet has {formatLPT(fromWei(has))}.
                  </p>
                )}
                <Button
                  variant="primary"
                  disabled={!chosen || !eligible || busy || tx.checking}
                  onClick={create}
                >
                  {busy && <Loader2 className="animate-spin" />}
                  {pinning
                    ? "Preparing LIP…"
                    : tx.signing
                    ? "Confirm in wallet…"
                    : tx.confirming
                    ? "Creating poll…"
                    : chosen
                    ? `Create poll for LIP-${chosen.lip}`
                    : "Choose a LIP"}
                </Button>
              </>
            )}
          </div>
        </>
      )}
    </Page>
  );
}
